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

TELE_TOKEN_TEST = "5756526738:AAFw_S43pkP1rQV1vw0WVsNil_xrV25aWAc"
PROVIDER_TOKEN = "284685063:TEST:YTFkN2IzNmI1MWUz"
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

REGISTER, NEW_USER, PROCEED_PAYMENT = range(3)


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
register_new_user: Save records of new Users in user DB
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
        if context.user_data["new_user"] == 0: # New User
            return NEW_USER
        if context.user_data["new_user"] == 1: # Existing User
            await complete_registration(update, context)
            return ConversationHandler.END
        if context.user_data["new_user"] == 2: # User re-register for the same event
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
        return 0

    # If user exists, check if they have already registered for the event
    else:
        logger.info(f'Checking registered events for {user_id}')
        endpoint_url = "http://localhost:3000"
        response = requests.get(endpoint_url + f"/getRegistrations/{user_id}")
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
            # Value used to flag out user re-registering for the same event
            return 2 
        else:
            # Value used to flag out existing user registering for new event
            return 1 


async def register_new_user(update: Update, context: ContextTypes.DEFAULT_TYPE):
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
    logger.info(f'Saving records of new user {user_id}')

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
        'event_title': event_title,
        'status' : 'pending'
    }

    endpoint_url = "http://localhost:3000"
    response = requests.post(endpoint_url + "/insertRegistration", json=data)

    if response.status_code == 200:
        await update.message.reply_text(
            f'Thank you for registering! We`ll be contacting you shortly'
        )
        logger.info(f'User {user_id} successfully registered for event: {event_title}')
        return ConversationHandler.END
    else:
        await update.message.reply_text(
            f'Sorry, there was an error with your registration. Please try again later'
        )
        return ConversationHandler.END

""""
=============================================================================================
check_registration: View events that user has registered for and their respective statuses
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
    response = requests.get(endpoint_url + f"/getRegistrations/{user_id}")
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

""""
=============================================================================================
make_payment: Check for successful registrations and prompt for event to make payment for
proceed_payment: Validate event title and send invoice
pre_checkout: Validate invoice payload to confirm transaction
successful_payment: Inform user of successful payment
=============================================================================================
"""
async def make_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text='Checking for any registration in our records'
    )
    user_id = update.message.from_user.id
    logger.info(f'Checking for successful registration for {user_id}')

    endpoint_url = "http://localhost:3000"
    response = requests.get(endpoint_url + f"/getSuccessfulRegistrations/{user_id}")
    response_data = response.json()

    text = ""
    if response_data:
        
        text += "Congragulations! Your registration is successful for the following events:\n\n"
        successful_event_titles = []
        for event in response_data:
            event_title = event['eventTitle']
            successful_event_titles.append(event_title)
            text += f"Event Title: *{event_title}*\n"
        
        text += "\nWhich Event would you like to make payment for?\n\n"
        # Save list of successful events
        context.user_data["successful_registrations"] = successful_event_titles
        await update.message.reply_text(text, parse_mode='Markdown')
        return PROCEED_PAYMENT
    else:
        text += "No successful events found! Use /checkRegistration view your registration status!"
        await update.message.reply_text(text)
        return ConversationHandler.END


async def proceed_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Check for valid event title
    event_title = update.message.text
    successful_event_titles = context.user_data["successful_registrations"]
    if event_title in successful_event_titles:
        await context.bot.send_invoice(
            chat_id=update.effective_chat.id, 
            title=f"Payment for event: {event_title}", 
            description="Ticket price includes registration fee, food & drinks, etc", 
            payload="Custom-Payload", 
            provider_token=PROVIDER_TOKEN, 
            currency="SGD", 
            prices=[LabeledPrice("Ticket Price", 5  * 100)]
        )
    else:
        await update.message.reply_text(
        text='Thats not a valid title name. Please provide a valid title'
        )
        return PROCEED_PAYMENT


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
            CommandHandler('cancel', cancel),
            CommandHandler('viewEvents', view_events),
            CommandHandler('register', register_for_event),
            CommandHandler('checkRegistration', check_registration),
            CommandHandler('makePayment', make_payment)
        ],
        states={
            REGISTER: [MessageHandler(filters.TEXT, check_event_title)],
            NEW_USER: [MessageHandler(filters.Regex('^([A-Za-z ]+): ([0-9A-Za-z.+-]+)$'), register_new_user)],
            PROCEED_PAYMENT: [MessageHandler(filters.TEXT, proceed_payment)],
        },
        fallbacks=[MessageHandler(filters.TEXT, unknown)]
    )
    application.add_handler(conversation_handler)
    application.add_handler(MessageHandler(filters.TEXT, unknown))
    application.add_handler(PreCheckoutQueryHandler(precheckout))
    application.add_handler(
        MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment)
    )

    application.run_polling()
