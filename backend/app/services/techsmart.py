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
                try:
                    # Esperamos a que el select exista y tenga más de 1 opción (es decir, cargaron las categorías reales)
                    await page.wait_for_function(
                        "document.querySelectorAll(\"select[name='txtCategoria'] option\").length > 2", 
                        timeout=15000
                    )
                except Exception as e:
                    print("⚠️ Timeout esperando a que carguen las categorías. ¿Falló el login o la página es lenta?")
                    
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
                        print(f"🔍 Extrayendo productos mediante inyección JS (High-Speed)...")
                        
                        js_code = """async () => {
                            let results = [];
                            let cards = document.querySelectorAll('.card.rounded');
                            let fetchPromises = [];

                            for (let i = 0; i < cards.length; i++) {
                                let card = cards[i];
                                if (i === 0) console.log("CARD HTML:", card.innerHTML); // DEBUG
                                
                                let descEl = card.querySelector('.text-card');
                                let desc = descEl ? descEl.innerText : 'Sin descripción';
                                
                                let codeEl = card.querySelector('.codigo-producto');
                                let codeText = codeEl ? codeEl.innerText : '';
                                
                                let techsmartCode = '';
                                let realSku = '';
                                let lines = codeText.split('\\n');
                                for (let line of lines) {
                                    let upperLine = line.toUpperCase().trim();
                                    if (upperLine.startsWith('CÓDIGO:') || upperLine.startsWith('CODIGO:')) {
                                        let parts = line.split(':');
                                        parts.shift();
                                        techsmartCode = parts.join(':').trim();
                                    } else if (upperLine.startsWith('MODELO:')) {
                                        let parts = line.split(':');
                                        parts.shift();
                                        realSku = parts.join(':').trim();
                                    }
                                }
                                if (!realSku) realSku = techsmartCode;
                                
                                let amountEl = card.querySelector('input[name="amount"]');
                                let originalPrice = amountEl ? parseFloat(amountEl.value || 0) : 0;
                                
                                let discountEl = card.querySelector('input[name="discount_amount"]');
                                let discountAmount = discountEl ? parseFloat(discountEl.value || 0) : 0;
                                
                                let promoPrice = originalPrice - discountAmount;
                                
                                let currencyEl = card.querySelector('input[name="currency_code"]');
                                let currency = currencyEl ? currencyEl.value.toUpperCase().trim() : 'MXN';
                                
                                let imgEl = card.querySelector('.img-catalogo');
                                let imageUrl = null;
                                if (imgEl) {
                                    imageUrl = imgEl.src;
                                    // Fallback to absolute URL construction if .src returns relative (rare but possible in some headless contexts)
                                    if (imageUrl && !imageUrl.startsWith('http')) {
                                        imageUrl = new URL(imgEl.getAttribute("src"), document.baseURI).href;
                                    }
                                }
                                
                                let productData = { 
                                    sku: realSku, 
                                    name: desc, 
                                    original_price: originalPrice, 
                                    promo_price: promoPrice,
                                    stock_gdl: 0, 
                                    stock_cdmx: 0,
                                    currency: currency,
                                    image_url: imageUrl,
                                    provider_name: 'TechSmart'
                                };
                                
                                if (techsmartCode) {
                                    // Petición AJAX en paralelo sin abrir modales
                                    let p = fetch('./acciones/cargaExistencias.php', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                        body: 'codArt=' + encodeURIComponent(techsmartCode)
                                    })
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.msg) {
                                            let gdlMatch = data.msg.match(/Sucursal GDL:\\s*(\\d+)/);
                                            if (gdlMatch) productData.stock_gdl = parseInt(gdlMatch[1], 10);
                                            
                                            let cdmxMatch = data.msg.match(/Sucursal CDMX:\\s*(\\d+)/);
                                            if (cdmxMatch) productData.stock_cdmx = parseInt(cdmxMatch[1], 10);
                                        }
                                        results.push(productData);
                                    })
                                    .catch(err => {
                                        results.push(productData);
                                    });
                                    fetchPromises.push(p);
                                } else {
                                    results.push(productData);
                                }
                            }

                            await Promise.all(fetchPromises);
                            return results;
                        }"""
                        
                        page_products = await page.evaluate(js_code)
                        if page_products and page_products[0].get("raw_html"):
                            print("============= CARD HTML DEBUG =============")
                            print(page_products[0]["raw_html"])
                            print("===========================================")
                            
                        products.extend(page_products)
                        print(f"✅ Se extrajeron {len(page_products)} productos al instante.")
                                
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
