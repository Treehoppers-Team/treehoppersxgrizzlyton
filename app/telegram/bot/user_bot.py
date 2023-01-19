import logging
import json
import requests
from telegram import (
    Update, ReplyKeyboardMarkup, ReplyKeyboardRemove, LabeledPrice,
)
from telegram.ext import (
    ApplicationBuilder, ContextTypes, CommandHandler, 
    ConversationHandler, MessageHandler, StringCommandHandler,
    filters, PreCheckoutQueryHandler,
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

REGISTER = range(1)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "/viewEvents - View all ongoing events\n"
        "/register - Register for an ongoing event \n"
        "/checkRegistration - View registration status (pending/successful/unsuccessful) for an event \n"
        "/makePayment - Pay for the ticket for an event that you have successfully registered for \n"
        "/redeem - Redeem your ticket at the event venue"
        )

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('Thank you for visiting the ticketing bot')
    return ConversationHandler.END

async def unknown(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(
        chat_id=update.effective_chat.id, 
        text="Sorry, I didn't understand that command."
    )

""""
=============================================================================================
view_events: View ongoing events
=============================================================================================
"""

async def view_events(update: Update, context: ContextTypes.DEFAULT_TYPE):
    endpoint_url = "http://localhost:3000"
    response = requests.get(endpoint_url + "/viewEvents")
    response_data = response.json()
    text = ""

    # Format Response data
    for event in response_data:
        event_title = event['title']
        event_description = event['description']
        event_time = event['time']
        event_venue = event['venue']
        event_price = event['price']

        text += f"Event Title: *{event_title}*\n" \
            f"Description: {event_description}\n" \
            f"Time: {event_time}\n" \
            f"Venue: {event_venue}\n" \
            f"Price: *{event_price}*\n\n"
    text += "Use /register to register for any events that you are interested in"

    await update.message.reply_text(
        text, parse_mode='Markdown'
    )

async def register_for_event(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        'Please provide the title of the Event that you would like to register for'
    )
    return REGISTER

async def complete_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    event_title = update.message.text
    print("Complete registration function")
    await update.message.reply_text(
        f'Thank you for registring for {event_title}'
    )


if __name__ == '__main__':
    application = ApplicationBuilder().token(TELE_TOKEN_TEST).build()
    
    conversation_handler = ConversationHandler(
        entry_points=[
            CommandHandler('start', start),
            CommandHandler('cancel', cancel), 
            CommandHandler('viewEvents', view_events), 
            CommandHandler('register', register_for_event)
            ],
        states={
            REGISTER: [MessageHandler(filters.TEXT, complete_registration)]
        },
        fallbacks=[MessageHandler(filters.TEXT, unknown)]
    )
    application.add_handler(conversation_handler)
    application.add_handler(MessageHandler(filters.TEXT, unknown))
    
    application.run_polling()