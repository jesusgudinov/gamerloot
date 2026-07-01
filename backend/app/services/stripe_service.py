import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    @staticmethod
    def create_or_get_customer(user_email: str, name: str) -> str:
        """
        Busca un cliente en Stripe por email. Si no existe, lo crea.
        """
        try:
            customers = stripe.Customer.list(email=user_email, limit=1)
            if customers.data:
                return customers.data[0].id
            
            customer = stripe.Customer.create(
                email=user_email,
                name=name
            )
            return customer.id
        except stripe.error.StripeError as e:
            print(f"Stripe Error: {e}")
            return None

    @staticmethod
    def create_payment_intent(amount: float, order_id: int, user_email: str, customer_name: str, save_card: bool = False) -> dict:
        """
        Crea un PaymentIntent para una orden.
        Si save_card es True, se genera un Customer y se configura setup_future_usage.
        """
        try:
            intent_kwargs = {
                "amount": int(amount * 100),
                "currency": "mxn",
                "metadata": {
                    "order_id": order_id,
                    "user_email": user_email
                },
                "automatic_payment_methods": {
                    "enabled": True,
                },
            }

            if save_card:
                customer_id = StripeService.create_or_get_customer(user_email, customer_name)
                if customer_id:
                    intent_kwargs["customer"] = customer_id
                    intent_kwargs["setup_future_usage"] = "off_session"

            intent = stripe.PaymentIntent.create(**intent_kwargs)
            return {"client_secret": intent.client_secret, "id": intent.id}
        except stripe.error.StripeError as e:
            return {"error": str(e)}

    @staticmethod
    def get_saved_payment_methods(customer_id: str) -> list:
        try:
            methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type="card",
            )
            return methods.data
        except stripe.error.StripeError:
            return []

    @staticmethod
    def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
        """
        Verifica la firma del webhook recibido de Stripe.
        """
        return stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
