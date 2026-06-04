import asyncio
from typing import List, Dict, Any
from app.core.config import settings

class TechSmartScraper:
    def __init__(self):
        self.rfc = settings.TECHSMART_RFC
        self.username = settings.TECHSMART_USERNAME
        self.password = settings.TECHSMART_PASSWORD
        self.base_url = "https://www.techsmart.com.mx/techsmartv2/"

    async def _destroy_modals(self, page):
        """Elimina mediante inyección JS cualquier rastro de pop-ups intrusivos"""
        await page.evaluate("""() => {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.querySelectorAll('.modal').forEach(el => {
                el.style.display = 'none';
                el.classList.remove('show');
            });
            document.body.classList.remove('modal-open');
        }""")
        await asyncio.sleep(0.5)

    async def get_products(self, progress_callback=None) -> List[Dict[str, Any]]:
        """
        Inicia un navegador headless con Playwright, se loguea en TechSmart,
        cierra popups y extrae el catálogo iterando por todas las categorías y páginas.
        """
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            print("⚠️ Playwright no está instalado en el entorno actual.")
            return []

        products = []
        print("🤖 Iniciando Scraper de TechSmart (Playwright Async)...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                print("🌐 Navegando al Login de TechSmart...")
                await page.goto(self.base_url, wait_until="networkidle")
                
                await self._destroy_modals(page)
                
                # Rellenar form y presionar Enter
                await page.click("#loginClick", force=True)
                await page.fill("#rfc1", self.rfc)
                await page.fill("#usuario", self.username)
                await page.fill("#txtPass", self.password)
                
                print("🔑 Ejecutando Login (Enter)...")
                # Presionar Enter estando en el campo de password
                await page.focus("#txtPass")
                await page.keyboard.press("Enter")
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2) # Dar tiempo a redirecciones y animaciones
                
                await self._destroy_modals(page)
                
                # 3. Navegar al Catálogo directamente por URL
                print("📦 Abriendo Catálogo...")
                await page.goto(self.base_url + "Clientes/Catalogo", wait_until="networkidle")
                await asyncio.sleep(2)
                
                await self._destroy_modals(page)
                # Obtener lista de categorías reales (ignorando la de selección)
                categories = await page.evaluate("""() => {
                    return Array.from(document.querySelectorAll("select[name='txtCategoria'] option"))
                        .map(o => o.value)
                        .filter(v => v !== "-1" && v !== "");
                }""")
                
                print(f"📂 Se detectaron {len(categories)} categorías. Iniciando barrido completo...")
                
                for index, cat_value in enumerate(categories):
                    print(f"👉 Escaneando Categoría: {cat_value}")
                    if progress_callback:
                        progress_callback(10 + int((index/len(categories))*80), f"Categoría: {cat_value}")
                    # Seleccionar la categoría
                    await page.select_option("select[name='txtCategoria']", value=cat_value)
                    
                    try:
                        await page.select_option("select[name='txtMarca']", label="TODAS LAS MARCAS")
                    except Exception:
                        pass
                        
                    await page.wait_for_load_state("networkidle")
                    await asyncio.sleep(2)
                    
                    page_num = 1
                    while True:
                        print(f"📄 Procesando Página {page_num} de {cat_value}...")
                        if progress_callback:
                            progress_callback(None, f"Pág {page_num} de {cat_value}...")
                        cards = await page.query_selector_all(".card.rounded")
                        print(f"🔍 Extrayendo {len(cards)} productos...")
                        
                        import re
                        for card in cards:
                            desc_el = await card.query_selector(".text-card")
                            desc = await desc_el.inner_text() if desc_el else "Sin descripción"
                            
                            code_el = await card.query_selector(".codigo-producto")
                            code_text = await code_el.inner_text() if code_el else ""
                            
                            real_sku = ""
                            techsmart_code = ""
                            for line in code_text.split('\n'):
                                line_upper = line.upper().strip()
                                if line_upper.startswith('CÓDIGO:') or line_upper.startswith('CODIGO:'):
                                    techsmart_code = line.split(':', 1)[-1].strip()
                                elif line_upper.startswith('MODELO:'):
                                    real_sku = line.split(':', 1)[-1].strip()
                                    
                            if not real_sku:
                                real_sku = techsmart_code
                            
                            print(f"RAW TEXT: {repr(code_text)} | TECH_CODE: {techsmart_code} | REAL_SKU: {real_sku}")
                                    
                            amount_el = await card.query_selector("input[name='amount']")
                            price = float(await amount_el.get_attribute("value") or 0.0) if amount_el else 0.0
                            
                            stock_gdl = 0
                            stock_cdmx = 0
                            
                            if techsmart_code:
                                try:
                                    await page.evaluate(f"muestraExistencias('{techsmart_code}', 'Stock')")
                                    await page.wait_for_selector(".swal2-html-container", state="visible", timeout=3000)
                                    
                                    swal_el = await page.query_selector(".swal2-html-container")
                                    text = await swal_el.inner_text() if swal_el else ""
                                    
                                    gdl_match = re.search(r"Sucursal GDL:\s*(\d+)", text)
                                    if gdl_match: stock_gdl = int(gdl_match.group(1))
                                        
                                    cdmx_match = re.search(r"Sucursal CDMX:\s*(\d+)", text)
                                    if cdmx_match: stock_cdmx = int(cdmx_match.group(1))
                                        
                                    await page.keyboard.press("Escape")
                                    await asyncio.sleep(0.5)
                                    
                                except Exception as parse_e:
                                    await page.keyboard.press("Escape")
                            
                            if real_sku:
                                products.append({
                                    "sku": real_sku,
                                    "name": desc,
                                    "price": price,
                                    "stock_gdl": stock_gdl,
                                    "stock_cdmx": stock_cdmx,
                                    "currency": "MXN",
                                    "provider_name": "TechSmart",
                                })
                                
                        # Buscar Paginación Siguiente
                        # Generalmente es un enlace con aria-label="Next" o que contiene ">>" o "Siguiente"
                        has_next = await page.evaluate("""() => {
                            let nextBtn = Array.from(document.querySelectorAll('.pagination a')).find(el => 
                                el.innerText.includes('>>') || 
                                el.innerText.includes('Siguiente') || 
                                el.getAttribute('aria-label') === 'Next'
                            );
                            if (nextBtn && !nextBtn.parentElement.classList.contains('disabled')) {
                                nextBtn.click();
                                return true;
                            }
                            return false;
                        }""")
                        
                        if has_next:
                            page_num += 1
                            await page.wait_for_load_state("networkidle")
                            await asyncio.sleep(2)
                            await self._destroy_modals(page) # Limpiar modales por si acaso
                        else:
                            break # Fin de esta categoría
                            
            except Exception as e:
                print(f"❌ Error durante el Scraping de TechSmart: {e}")
            finally:
                await browser.close()
                
        return products
