import logging
import json
import requests
from telegram import (
    Update, ReplyKeyboardMarkup, ReplyKeyboardRemove, LabeledPrice,
)
from telegram.ext import (
    ApplicationBuilder, ContextTypes, CommandHandler,
    ConversationHandler, MessageHandler, StringCommandHandler,
    filters, PreCheckoutQueryHandler, CallbackQueryHandler, CallbackContext
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

REGISTER, NEW_USER = range(2)


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
    return ConversationHandler.END

""""
=============================================================================================
register_for_event: Prompt user for event title
check_event_title: Validate event title provided
check_existing_user: Prompt new users for contact info & check if
    existing users have already registered for the event
complete_registration: Send API request with registration details
=============================================================================================
"""


async def register_for_event(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        'Please provide the title of the Event that you would like to register for'
    )
    return REGISTER


async def check_event_title(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Get Event list from the database
    event_title = update.message.text
    endpoint_url = "http://localhost:3000"
    response = requests.get(endpoint_url + "/viewEvents")
    response_data = response.json()
    events = []
    for event in response_data:
        events.append(event['title'])
    logger.info(f"Existing Event titles: {events}")

    if event_title in events:
        # Save event_title in context object
        context.user_data["event_title"] = event_title
        context.user_data["new_user"] = await check_existing_user(update, context)
        if context.user_data["new_user"]:
            return NEW_USER
        else:
            await complete_registration(update, context)
            return ConversationHandler.END

    else:
        await update.message.reply_text(
            f'Event {event_title} does not exist, please provide a valid event title'
        )
        return REGISTER


async def check_existing_user(update: Update, context: CallbackContext):
    user_id = update.message.from_user.id
    endpoint_url = "http://localhost:3000"
    response = requests.get(endpoint_url + f"/getUserInfo/{user_id}")
    response_data = response.json()

    # If user does not exists, prompt for their name and contact
    if response_data['name'] == "No Such User Exists":
        await update.message.reply_text( 
            'Please input your name and contact number in this format `name : contact`'
        )
        return True

    # If user exists, check if they have already registered for the event
    else:
        print("Existing user")
        logger.info(f'Checking status for {user_id}')

        endpoint_url = "http://localhost:3000"
        response = requests.get(endpoint_url + f"/checkRegistration/{user_id}")
        response_data = response.json()

        event_title = context.user_data["event_title"]
        registered_events = []
        for registration_details in response_data:
            registered_events.append(registration_details["eventTitle"])
        if event_title in registered_events:
            await update.message.reply_text(
                f'You have already registered for Event: {event_title} \n' 
                'You can only register once per event'
            )
            return ConversationHandler.END
        else:
            context.user_data["new_user"] = False
            await update.message.reply_text(
                f'Proceeding with your registration for: {event_title} \n' 
            )
            return False


async def register_new_user(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print("Registering New user")
    user_info = update.message.text.split(': ')
    user_id = update.message.from_user.id
    user_handle = update.message.from_user.username
    user_name = user_info[0]
    user_contact = user_info[1]
    data = {
        'user_id': user_id,
        'user_handle': user_handle,
        'user_name': user_name,
        'user_contact': user_contact,
    }

    endpoint_url = "http://localhost:3000"
    response = requests.post(endpoint_url + "/uploadUserInfo", json=data)
    if response.status_code == 200:
        await complete_registration(update, context)
        return ConversationHandler.END
    else:
        await complete_registration(update, context)
        return ConversationHandler.END

async def complete_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    event_title = context.user_data["event_title"]
    data = {
        'user_id': user_id,
        'event_title': event_title
    }

    endpoint_url = "http://localhost:3000"
    response = requests.post(endpoint_url + "/insertRegistration", json=data)

    if response.status_code == 200:
        await update.message.reply_text(
            f'Thank you for registering! We`ll be contacting you shortly'
        )
        return ConversationHandler.END
    else:
        await update.message.reply_text(
            f'Sorry, there was an error with your registration. Please try again later'
        )
        return ConversationHandler.END
""""
=============================================================================================
check_registration: Send API request with user's telegram ID to view events 
registered and their respective statuses
=============================================================================================
"""


async def check_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text="Checking for events that you have registered for..."
    )

    user_id = update.message.from_user.id
    logger.info(f'Checking status for {user_id}')

    endpoint_url = "http://localhost:3000"
    response = requests.get(endpoint_url + f"/checkRegistration/{user_id}")
    response_data = response.json()

    # Format Response data
    text = ""
    # Checks if any events registered
    if response_data:
        text += "These are your current registered events!\n\n"
        for event in response_data:
            event_title = event['eventTitle']
            status = event['status']

            text += f"Event Title: *{event_title}*\n" \
                f"Registration Status: {status}\n\n" \

    else:
        text += "No events found! Use /register to register for an event!"

    await update.message.reply_text(
        text, parse_mode='Markdown'
    )
    return ConversationHandler.END


if __name__ == '__main__':
    application = ApplicationBuilder().token(TELE_TOKEN_TEST).build()

    conversation_handler = ConversationHandler(
        entry_points=[
            CommandHandler('start', start),
            CommandHandler('cancel', cancel),
            CommandHandler('viewEvents', view_events),
            CommandHandler('register', register_for_event),
            CommandHandler('checkRegistration', check_registration)
        ],
        states={
            REGISTER: [MessageHandler(filters.TEXT, check_event_title)],
            NEW_USER: [MessageHandler(filters.Regex('^([A-Za-z ]+): ([0-9A-Za-z.+-]+)$'), register_new_user)],
        },
        fallbacks=[MessageHandler(filters.TEXT, unknown)]
    )
    application.add_handler(conversation_handler)
    application.add_handler(MessageHandler(filters.TEXT, unknown))

    application.run_polling()
