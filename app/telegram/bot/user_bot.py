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

TELE_TOKEN_TEST = os.getenv('TELE_TOKEN_TEST')
PROVIDER_TOKEN = os.getenv('TEST_PAYMENT_TOKEN')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

REGISTER, COMPLETE_REGISTER = range(2)

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

""""
=============================================================================================
register_for_event
=============================================================================================
"""

async def register_for_event(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        'Please provide the title of the Event that you would like to register for'
    )
    return REGISTER

async def get_registration_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Get Event list from the database
    event_title = update.message.text
    endpoint_url = "http://localhost:3000"
    response = requests.get(endpoint_url + "/viewEvents")
    response_data = response.json()
    events = []
    for event in response_data:
        events.append(event['title'])
    print(f"Existing Event titles: {events}")

    # Check if event exist
    if event_title in events:
        await update.message.reply_text(
            f'Thank you for your interest in {event_title}, please input your name and contact number in this format `name : contact`'
        )
        return COMPLETE_REGISTER
    else:
        await update.message.reply_text(
            f'Event {event_title} does not exist, please provide a valid event title'
        )
        # TODO: Add logic to allow users to call /viewEvents?
        return REGISTER

async def complete_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print("Complete registration function")
    user_info = update.message.text.split(': ')

    endpoint_url = "http://localhost:3000"
    user_name = user_info[0]
    user_contact = user_info[1]
    user_handle = update.message.from_user.username
    data = {'user_name': user_name, 'user_contact': user_contact, 'user_handle': user_handle}

    response = requests.post(endpoint_url + "/uploadUserInfo", json = data)
    
    if response.status_code == 200:
        await update.message.reply_text(
            f'Thank you for registering! We`ll be contacting you shortly'
        )
    else:
        await update.message.reply_text(
            f'Sorry, there was an error with your registration. Please try again later'
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
            REGISTER: [MessageHandler(filters.TEXT, get_registration_info)],
            COMPLETE_REGISTER: [MessageHandler(filters.Regex('^([A-Za-z ]+): ([0-9A-Za-z.+-]+)$'), complete_registration)],
        },
        fallbacks=[MessageHandler(filters.TEXT, unknown)]
    )
    application.add_handler(conversation_handler)
    application.add_handler(MessageHandler(filters.TEXT, unknown))
    
    application.run_polling()