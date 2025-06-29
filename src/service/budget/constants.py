class ERRORCODE:
    EXISTING_CATTLE_HISTORY_FOR_CATTLE_STATIC = "A cattle history associated with this cattle_static already exists. Please delete the associated cattle history first."

class TRANSACTION_CATEGORIES:
    TRANSFER_SENT = [
        r"transferencia (realizada|inmediata|enviada).*a",
        r"orden de pago.*a",
        r"transferencia salida",
        r"transferencia.*emitida",
        r"envio de dinero",
        r"transf\.\s*mobile",
        r"transferencia enviada",
        r"transferencia realizada",
    ]
    TRANSFER_RECEIVED = [
        r"transferencia recibida",
        r"acreditacion.*transferencia",
        r"transferencia entrante",
        r"transferencia.*ingresada",
        r"ingreso por transferencia",
        r"trans pag suel",
    ]
    SERVICE_PAYMENT = [
        r"pago de servicios",
        r"pago .*movistar",
        r"pago .*edenor",
        r"pago .*telecom",
        r"pago .*metrogas",
        r"pagos? .*servicio",
        r"pago online de servicios",
        r"pago.*aysa",
        r"pago.*tarjeta SUBE",
        r"pago.*google",
        r"pago.*railway",
        r"pago.*365",
        r"^pago\s*$",
    ]
    CREDIT_CARD_PAYMENT = [
        r"pago tarjeta de credito",
        r"pago.*visa",
        r"pago.*mastercard",
        r"pago.*american express",
        r"visa.*pago",
        r"mastercard.*pago",
    ]
    WITHDRAWAL = [
        r"extraccion autoservicio",
        r"retiro.*cajero",
        r"extraccion cajero automatico",
        r"extraccion en efectivo",
        r"extraccion.*atm",
    ]
    INVESTMENT_SUBSCRIPTION = [
        r"suscripcion",
        r"liquidacion titulos debito",
        r"aporte a fondo comun",
        r"compra de fondos",
        r"inversion.*suscrip",
        r"fondeo de cartera",
        r"superfondo",
        r"plazo fijo.*constitucion",
    ]
    INTEREST_INCOME = [
        r"pago interes",
        r"liquidacion de intereses",
        r"rendimientos",
        r"interes.*plazo fijo",
        r"interes.*fondo",
        r"intereses ganados",
        r"acreditacion.*interes",
        r"pago interes por saldo en cuenta",
    ]
    DEBIT_PURCHASE = [
        r"compra con tarjeta de debito",
        r"compra en comercio",
        r"consumo con debito",
        r"compra.*pos",
        r"compra.*mercado pago",
        r"debito en cuenta por consumo",
        r"^cpa\.",
        r"^consumo.*",
    ]
    DIRECT_DEBIT = [
        r"debito inmediato",
        r"snp debito directo",
        r"deb\. automatico",
        r"debito automatico.*servicio",
        r"debito en cuenta.*netflix",
        r"debito directo",
        r"cbu debitado",
        r"adhesion debito automatico",
        r"deb prea debin",
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
