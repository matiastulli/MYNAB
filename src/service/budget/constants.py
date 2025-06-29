class ERRORCODE:
    EXISTING_CATTLE_HISTORY_FOR_CATTLE_STATIC = "A cattle history associated with this cattle_static already exists. Please delete the associated cattle history first."

class TRANSACTION_CATEGORIES:
    TRANSFER_SENT = [
        r"transferencia (realizada|inmediata|enviada).*a",
    ]
    TRANSFER_RECEIVED = [
        r"transferencia recibida",
    ]
    SERVICE_PAYMENT = [
        r"pago de servicios",
        r"pago .*movistar",
        r"pago .*edenor",
    ]
    CREDIT_CARD_PAYMENT = [
        r"pago tarjeta de credito",
    ]
    WITHDRAWAL = [
        r"extraccion autoservicio",
    ]
    INVESTMENT_SUBSCRIPTION = [
        r"suscripcion",
        r"liquidacion titulos debito",
    ]
    INTEREST_INCOME = [
        r"pago interes",
        r"liquidacion de intereses",
        r"rendimientos",
    ]
    DEBIT_PURCHASE = [
        r"compra con tarjeta de debito",
    ]
    DIRECT_DEBIT = [
        r"debito inmediato",
        r"snp debito directo",
        r"deb\. automatico",
    ]

# Map of category keys to database IDs
# These should match the IDs in the budget_transaction_category table
CATEGORY_IDS = {
    "TRANSFER_SENT": 1,
    "TRANSFER_RECEIVED": 2,
    "SERVICE_PAYMENT": 3,
    "CREDIT_CARD_PAYMENT": 4,
    "WITHDRAWAL": 5,
    "INVESTMENT_SUBSCRIPTION": 6,
    "INTEREST_INCOME": 7,
    "DEBIT_PURCHASE": 8,
    "DIRECT_DEBIT": 9,
}
