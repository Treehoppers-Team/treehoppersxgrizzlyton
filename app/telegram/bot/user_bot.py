import logging
from telegram import (
    Update, ReplyKeyboardMarkup, ReplyKeyboardRemove, LabeledPrice
)
from telegram.ext import (
    ApplicationBuilder, ContextTypes, CommandHandler, 
    ConversationHandler, MessageHandler, StringCommandHandler,
    filters, PreCheckoutQueryHandler
)
import os
from dotenv import load_dotenv

load_dotenv()

TELE_TOKEN_TEST = os.getenv('TELEGRAM_TOKEN')
PROVIDER_TOKEN = os.getenv('TEST_PAYMENT_TOKEN')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# EVENT, FINALIZE, SHARE = range(3)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "/viewEvents - View all ongoing events\n"
        "/register - Register for an ongoing event \n"
        "/checkRegistration - View registration status (pending/successful/unsuccessful) for an event \n"
        "/makePayment - Pay for the ticket for an event that you have successfully registered for \n"
        "/redeem - Redeem your ticket at the event venue"
        )

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    update.message.reply_text('Conversation cancelled.')
    return ConversationHandler.END

"""""
=============================================================================================
These are the functions for clients to make payments
make_payment: Send an invoice with the product info & price to the user
precheckout: Verify payload and validity of transaction (10s leeway)
successful_payment: Additional logic after payment has been confirmed
=============================================================================================
"""
async def make_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_invoice(
        chat_id=update.effective_chat.id, 
        title="Community Tool Subscription", 
        description="A platform for generating events for your projects and publicizing them to users", 
        payload="Custom-Payload", 
        provider_token=PROVIDER_TOKEN, 
        currency="SGD", 
        prices=[LabeledPrice("Test", 5  * 100)]
    )

async def precheckout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Answers the PreQecheckoutQuery"""
    query = update.pre_checkout_query
    # check the payload
    if query.invoice_payload != "Custom-Payload":
        # answer False pre_checkout_query
        await query.answer(ok=False, error_message="Something went wrong...")
    else:
        await query.answer(ok=True)

async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Confirms the successful payment."""
    # Send payment info to endpoint for storage on firebase
    await update.message.reply_text("Thank you for your payment!")

if __name__ == '__main__':
    application = ApplicationBuilder().token(TELE_TOKEN_TEST).build()
    
    conversation_handler = ConversationHandler(
    entry_points=[
        CommandHandler('start', start),
        ],
    states={
        # EVENT:  [MessageHandler(filters.Regex("^(Yes)$"), event)],
    },
    fallbacks=[CommandHandler('cancel', cancel)]
)
    application.add_handler(PreCheckoutQueryHandler(precheckout))
    application.add_handler(
        MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment)
    )
    application.add_handler(conversation_handler)
    
    application.run_polling()