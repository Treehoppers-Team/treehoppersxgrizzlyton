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
PROVIDER_TOKEN = os.getenv('TEST_TOKEN')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

EVENT, FINALIZE, SHARE = range(3)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "/payment - Make payment for this service\n"
        "/event - Create a new Event \n"
        "/viewEvents - View all the Events created",
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

"""""
=============================================================================================
These are the functions to create an event
event: Prompts the user to provide necessary details for the event
finalize: Prompts the user to confirm the event details
share: Create a shareable link with the event details for the client
=============================================================================================
"""

async def event(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Hi, please provide your event details in the following format: \n\n"
        "Title : Description : Venue : Time"
    )
    return FINALIZE

async def finalize(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_response = update.message.text
    title = user_response.split(' : ')[0]
    description = user_response.split(' : ')[1]
    venue = user_response.split(' : ')[2]
    time = user_response.split(' : ')[3]

    context.user_data['title'] = title
    context.user_data['description'] = description
    context.user_data['venue'] = venue
    context.user_data['time'] = time

    reply_keyboard = [["Yes", "No"]]

    await update.message.reply_text(
        "Thanks for your input! This is the event that you created: \n\n"
        f"Event Title:  {title} \n"
        f"Event Description:  {description} \n"
        f"Event Venue:  {venue} \n"
        f"Event Time:  {time} \n\n"
        "Do you confirm that these details are correct?", 
        reply_markup=ReplyKeyboardMarkup(
            reply_keyboard, one_time_keyboard=True, input_field_placeholder="Yes/No"
        ),
    )
    return SHARE

async def share(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_response = update.message.text

    if user_response == "No":
        reply_keyboard = [["Yes"]]
        await update.message.reply_text(
            "Do You want to edit the event details?",
            reply_markup=ReplyKeyboardMarkup(
                reply_keyboard, one_time_keyboard=True, input_field_placeholder="Yes"
            ),
        )
        return EVENT

    else:
        title =  context.user_data['title']
        description =  context.user_data['description']
        venue =  context.user_data['venue']
        time =  context.user_data['time']

        await context.bot.send_message(
            chat_id=update.effective_chat.id, 
            text="Here is the event info for sharing: \n\n"
            f"Event Title:  {title} \n"
            f"Event Description:  {description} \n"
            f"Event Venue:  {venue} \n"
            f"Event Time:  {time} \n\n"
        )
        return ConversationHandler.END

if __name__ == '__main__':
    application = ApplicationBuilder().token(TELE_TOKEN_TEST).build()
    
    conversation_handler = ConversationHandler(
    entry_points=[
        CommandHandler('start', start),
        CommandHandler('payment',make_payment),
        CommandHandler('event', event),
        ],
    states={
        EVENT:  [MessageHandler(filters.Regex("^(Yes)$"), event)],
        FINALIZE: [MessageHandler(filters.Regex("^(.*):(.*):(.*):(.*)"), finalize)],
        SHARE: [MessageHandler(filters.Regex("^(Yes|No)$"), share)], 
    },
    fallbacks=[CommandHandler('cancel', cancel)]
)
    application.add_handler(conversation_handler)

    application.add_handler(PreCheckoutQueryHandler(precheckout))
    application.add_handler(
        MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment)
    )
    
    application.run_polling()