import logging
import json
import pyqrcode
import requests
import datetime
from telegram import (
    Update, ReplyKeyboardMarkup, ReplyKeyboardRemove, LabeledPrice, InlineKeyboardButton,
    InlineKeyboardMarkup
)
from telegram.constants import ParseMode
from telegram.ext import (
    ApplicationBuilder, ContextTypes, CommandHandler,
    ConversationHandler, MessageHandler, StringCommandHandler,
    filters, PreCheckoutQueryHandler, CallbackQueryHandler, CallbackContext,
)
import os
from dotenv import load_dotenv
from sys import platform

load_dotenv()

# Environment Variables
# TELE_TOKEN_TEST = "5756526738:AAFw_S43pkP1rQV1vw0WVsNil_xrV25aWAc"
# PROVIDER_TOKEN = "284685063:TEST:NWI0MWExMzZjNmMw"
TELE_TOKEN_TEST = os.getenv("TELE_TOKEN_TEST")
PROVIDER_TOKEN = os.getenv("PROVIDER_TOKEN")

# Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Global Variables
endpoint_url = "http://localhost:3000"

NEW_USER, PROCEED_PAYMENT, TITLE, VERIFY_BALANCE, REDEEM = range(5)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):

    # Sending sticker
    # await context.bot.send_sticker(
    #     chat_id=update.effective_chat.id,
    #     sticker="CAACAgUAAxkBAAEdQ8Zj7ZYFybawCJjuDjSBkPVar-3wzgACmQgAAu5VcVe3bMjyKRHSlC4E",
    # )
    # Buttons
    # keyboard = [
    #     [
    #         InlineKeyboardButton("Option 1", callback_data="1"),
    #         InlineKeyboardButton("Option 2", callback_data="2"),
    #     ],
    #     [InlineKeyboardButton("Option 3", callback_data="3")],
    # ]
    # reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "[​​​​​​​​​​​](https://bafybeicugtsyjqhdisuvug35rathnyxwac7km5gkl66g2jwvebdgbis354.ipfs.w3s.link/mynt.webp) *Welcome to Mynt ticketing bot!* \n"
        "/viewWalletBalance - View the current Balance of your Mynt wallet\n"
        "/viewTransactionHistory - View all transactions for your Mynt wallet\n"
        "/topUpWallet - Top up your Mynt wallet\n\n"
        "/viewEvents - View all ongoing events\n"
        "/register - Register for an ongoing event \n"
        "/checkRegistration - View registration status (pending/successful/unsuccessful) for an event \n"
        "/redeem - Redeem your ticket at the event venue\n",
        parse_mode="markdown", 
        # reply_markup=reply_markup
    )
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('Thank you for visiting the ticketing bot')
    return ConversationHandler.END


async def unknown(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text="Sorry, I didn't understand that command."
    )


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error(msg="Exception while handling an update:",
                 exc_info=context.error)
    await update.message.reply_text(
        "Sorry, an unexpected error occurred \n"
        "Please try again later")
    return ConversationHandler.END


""""
=============================================================================================
view_wallet: Display in-app wallet (should eventually be integrated with viewwalletBalance, 
    viewTransactionHistory and TopUp Wallet ), needs to be web app (either created in react etc)
=============================================================================================
"""


async def view_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE):
    return ConversationHandler.END


""""
=============================================================================================
view_wallet_balance: Display balance of in-app wallet
view_transaction_history: Display all transactions for the wallet
=============================================================================================
"""


async def view_wallet_balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    logger.info(f"Retrieving wallet balance for User: {user_id}")
    response = requests.get(endpoint_url + f"/viewWalletBalance/{user_id}")
    response_data = response.json()
    user_balance = response_data['balance']
    await update.message.reply_text(f'Your wallet balance is ${user_balance}')
    return ConversationHandler.END


async def view_transaction_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    logger.info(f"Retrieving transaction history for User: {user_id}")
    response = requests.get(
        endpoint_url + f"/viewTransactionHistory/{user_id}")
    response_data = response.json()

    # Format Response data
    if len(response_data) > 0:
        text = "Your transaction History is as follows \n\n"

        for transaction in response_data:
            transaction_type = transaction['transactionType']
            amount = transaction['amount']
            time = transaction['timestamp']
            event = transaction['eventTitle'] if 'eventTitle' in transaction else "-"

            text += f"Transaction Type: *{transaction_type}*\n" \
                f"Amount: ${amount}\n" \
                f"Time: {time}\n" \
                f"Event: {event}\n\n"
    else:
        text = "You have no prior transactions"
    await update.message.reply_text(text, parse_mode='Markdown')
    return ConversationHandler.END

""""
=============================================================================================
redeem: Displays events that the user has successfully registered for and are yet to be redeemed. After user picks an event, show_QR will be called that will display a QR code containing information on the user's id, event status and event title
check_authorisation (merchant): should be in the merchant side. we get the telegram id, use getRegistrations Firebase to see what the user has registered for, compare to the current event and send a message back to the user and authoriser saying {handle} has been verified for XX event
=============================================================================================
"""


async def redeem(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    logger.info(f"Retrieving registrations for User: {user_id}")
    response = requests.get(
        endpoint_url + f"/getRegistrations/{user_id}")
    response_data = response.json()

    # Format Response data
    if len(response_data) <= 0:
        text = "You have no registered events"
        await update.message.reply_text(text, parse_mode='Markdown')
        return ConversationHandler.END

    else:
        registered_events = {}
        reply_string = ''
        count = 1

        for events in response_data:
            eventTitle = events['eventTitle']
            status = events['status']
            user_id = events['userId']
            if "SUCCESSFUL" in status:  # if status == 'success' did not work strange
                registered_events[eventTitle] = {
                    'userId': user_id, 'status': status, 'eventTitle': eventTitle}
                reply_string += f'\n {count}. {eventTitle}'
                count += 1

        if len(registered_events) == 0:  # if raffle was not successful - he did not get the ticket
            text = "You have no successful registrations"
            await update.message.reply_text(text, parse_mode='Markdown')
            return ConversationHandler.END

        reply_string += '\n\n Which one would you like to redeem?'

        reply_keyboard = [list(registered_events.keys())]
        print('--------------------')
        print(reply_keyboard)
        print('--------------------')
        # very important to keey the information
        context.user_data['registered_events'] = registered_events
        print('--------------------')
        print(context.user_data['registered_events'])
        print('--------------------')

        await update.message.reply_text(
            "You have available tickets! You currently have: \n"
            f'{reply_string}',
            reply_markup=ReplyKeyboardMarkup(
                reply_keyboard, one_time_keyboard=True, input_field_placeholder="ShengSiong/Grab?"
            ),)
        return REDEEM


async def show_QR(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ticket = update.message.text
    username = update.message.from_user.username
    user_id = update.message.from_user.id
    user_chat_id = update.effective_chat.id
    registered_events = context.user_data['registered_events']
    registered_events[ticket]['chatId'] = user_chat_id
    qr_information = registered_events[ticket]
    qr_information_str = json.dumps(qr_information)
    print('--------------------')
    print(qr_information)
    print('--------------------')

    await update.message.reply_text(f'Show this QR code to redeem your ticket for {ticket}. This QR code belongs to {username}')
    url = pyqrcode.create(qr_information_str)
    url.png(f'./qr_codes/{user_id}.png', scale=6)
    await update.message.reply_photo(f'./qr_codes/{user_id}.png')
    # add code to delete photo as well
    current_path = os.getcwd()
    if platform != 'darwin':  # windows
        picture_path = current_path + f'\qr_codes\{user_id}.png'
    else:  # mac or linux
        picture_path = current_path + f'/qr_codes/{user_id}.png'
    # print(f'Your current path is {picture_path}')
    os.remove(picture_path)
    return ConversationHandler.END

""""
=============================================================================================
top_up_wallet: Prompt new user for their details
is_new_user: check whether a user is a new user
register_new_user: send API request to save user records
get_topup_amount: prompt user for top up amount
proceed_payment: send payment invoice based on top up amount
precheckout: Answer the PreQecheckoutQuery
successful_payment: Confirms successful payment and sends API request to update relevant records
=============================================================================================
"""


async def top_up_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["new_user"] = await is_new_user(update, context)
    if context.user_data["new_user"] == True:
        await update.message.reply_text(
            'Please input your name and contact number in this format `name : contact`'
        )
        return NEW_USER

    else:
        await update.message.reply_text(
            "Proceeding with existing user"
        )
        await get_topup_amount(update, context)
        print("top_up_wallet -> get_topup_amount")
        return PROCEED_PAYMENT


async def is_new_user(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    response = requests.get(endpoint_url + f"/getUserInfo/{user_id}")
    response_data = response.json()
    if response_data['name'] == "No Such User Exists":
        return True
    else:
        return False


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

    response = requests.post(endpoint_url + "/uploadUserInfo", json=data)
    if response.status_code == 200:
        await update.message.reply_text('Successfully saved your contact info')
        await get_topup_amount(update, context)
        print("register_new_user -> get_topup_amount")
        return PROCEED_PAYMENT
    else:
        await update.message.reply_text('An unexpected error occurred')
        return ConversationHandler.END


async def get_topup_amount(update: Update, context: ContextTypes.DEFAULT_TYPE):
    reply_keyboard = [["10", "50", "100"]]
    await update.message.reply_text(
        "How much would you like to top up?\n"
        "Please select either $10/50/100",
        reply_markup=ReplyKeyboardMarkup(
            reply_keyboard, one_time_keyboard=True, input_field_placeholder="10/50/100"
        )
    )


async def proceed_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    topup_amount = int(update.message.text)
    context.user_data["toptop_amount"] = topup_amount
    await update.message.reply_text(f'The top up amount is {topup_amount}')
    await context.bot.send_invoice(
        chat_id=update.effective_chat.id,
        title=f"Top up Wallet",
        description="Topping up your Mynt wallet",
        payload="Custom-Payload",
        provider_token=PROVIDER_TOKEN,
        currency="SGD",
        prices=[LabeledPrice("Ticket Price", topup_amount * 100)]
    )
    return ConversationHandler.END


async def precheckout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info("Validating invoice payload")
    query = update.pre_checkout_query
    # check the payload
    if query.invoice_payload != "Custom-Payload":
        # answer False pre_checkout_query
        await query.answer(ok=False, error_message="Something went wrong...")
    else:
        await query.answer(ok=True)


async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Confirms the successful payment."""
    user_id = update.message.from_user.id
    topup_amount = context.user_data["toptop_amount"]
    logger.info(f'{user_id} has successfully topped up {topup_amount}')
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    data = {
        'user_id': user_id,
        'amount': topup_amount,
        'transaction_type': "TOP_UP",
        'timestamp': timestamp
    }
    response = requests.post(endpoint_url + "/topUpWallet", json=data)
    if response.status_code == 200:
        await update.message.reply_text(f"You have successfully topped up ${topup_amount}!")
    return ConversationHandler.END

""""
=============================================================================================
view_events: View ongoing events
check_registration: View status for users' registrations
register_for_event: Prompt user for event title
get_previous_registrations: API call to retrive previous registrations
validate_registration: Validate event title and check previous registrations
verify_balance: Check whether user has sufficient balance in in-app wallet
complete_purchase: Send API request to save payment records
complete_registration: Send API request to save registration records
=============================================================================================
"""


async def view_events(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info("Retrieving Events Information")
    response = requests.get(endpoint_url + "/viewEvents")
    response_data = response.json()
    text = ""

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

    await update.message.reply_text(text, parse_mode='Markdown')
    return ConversationHandler.END


async def check_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text="Checking for events that you have registered for..."
    )
    user_id = update.message.from_user.id
    logger.info(f'Checking status for {user_id}')
    response = requests.get(endpoint_url + f"/getRegistrations/{user_id}")
    response_data = response.json()
    text = ""

    # User has previously registered for events
    if response_data:
        text += "These are your current registered events!\n\n"
        for event in response_data:
            event_title = event['eventTitle']
            status = event['status']

            text += f"Event Title: *{event_title}*\n" \
                f"Registration Status: {status}\n\n" \

    # User has no previous registrations
    else:
        text += "No events found! Use /register to register for an event!"

    await update.message.reply_text(text, parse_mode='Markdown')
    return ConversationHandler.END


async def register_for_event(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        'Please provide the title of the Event that you would like to register for'
    )
    return TITLE


async def get_previous_registrations(update: Update, event_title):
    user_id = update.message.from_user.id
    logger.info(f'Checking previous registrations for {user_id}')
    response = requests.get(endpoint_url + f"/getRegistrations/{user_id}")
    response_data = response.json()

    # Save event titles for events that user has previously registered for
    registered_events = []
    if response_data:
        for event in response_data:
            registered_events.append(event['eventTitle'])

    # Check if user is registering for the same event
    if event_title in registered_events:
        await update.message.reply_text(
            f'You have already registered for Event: {event_title} \n'
            'You can only register once per event'
        )
        return ConversationHandler.END


async def validate_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    event_title = update.message.text
    context.user_data["event_title"] = event_title
    response = requests.get(endpoint_url + "/viewEvents")
    response_data = response.json()

    # Create mapping of event titles and their prices
    events_dict = {}
    for event in response_data:
        title = event['title']
        price = event['price']
        events_dict[title] = price
    event_title_list = events_dict.keys()
    logger.info(f"Existing Event titles: {event_title_list}")

    # User provided a valid event title
    if event_title in event_title_list:
        await update.message.reply_text(
            f'You have provided a valid title'
        )
        await get_previous_registrations(update, event_title)

        # Prompt user for payment confirmation
        event_price = events_dict[event_title]
        context.user_data["event_price"] = event_price
        reply_keyboard = [["Yes", "No"]]
        await update.message.reply_text(
            f'Do you wish to make a payment of ${event_price} for the event using your Mynt Wallet?\n'
            "Reply with Yes to confirm payment",
            reply_markup=ReplyKeyboardMarkup(
                reply_keyboard, one_time_keyboard=True, input_field_placeholder="Yes/No"
            )
        )
        return VERIFY_BALANCE

    # User provided and invalid event title
    else:
        await update.message.reply_text(
            f'Event {event_title} does not exist, please provide a valid event title'
        )
        return TITLE


async def verify_balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    payment_confirmation = update.message.text
    # User does not wish to proceed with making payment
    if payment_confirmation == "No":
        await update.message.reply_text(
            'You have declined to make a payment for the event ticket \n'
            'We hope to see you again'
        )
        return ConversationHandler.END

    # Verify user has sufficient balance in in-app wallet
    user_id = update.message.from_user.id
    logger.info(f"Verifying balance for user {user_id}")
    response = requests.get(endpoint_url + f"/viewWalletBalance/{user_id}")
    response_data = response.json()
    user_balance = response_data['balance']
    event_price = context.user_data["event_price"]

    # User has insufficient balance
    if user_balance < event_price:
        await update.message.reply_text(
            f"You have insufficient balance in your wallet \n"
            f"Your current balance is ${user_balance} but the ticket price is ${event_price} \n"
            "You /topUp to top up your Mynt Wallet"
        )
        return ConversationHandler.END

    # User has sufficient balance
    else:
        await complete_purchase(update, context)
        await complete_registration(update, context)
        return ConversationHandler.END


async def complete_purchase(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    event_price = context.user_data["event_price"]
    event_title = context.user_data["event_title"]
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    data = {
        'user_id': user_id,
        'amount': event_price,
        'transaction_type': "SALE",
        'timestamp': timestamp,
        'event_title': event_title,
    }
    response = requests.post(endpoint_url + "/ticketSale", json=data)
    logger.info("Saving payment records")
    if response.status_code == 200:
        await update.message.reply_text(f"Your wallet balance has been updated successfully")
    else:
        await update.message.reply_text("Sorry, something went wrong when updating your wallet balance")


async def complete_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    event_title = context.user_data["event_title"]
    logger.info(f'{user_id} has successfully regisered for {event_title}')
    data = {
        'user_id': user_id,
        'event_title': event_title,
        'status': 'PENDING',
    }
    response = requests.post(endpoint_url + "/insertRegistration", json=data)
    if response.status_code == 200:
        await update.message.reply_text(f"You have successfully registered for {event_title}!")
    else:
        await update.message.reply_text("Sorry, something went wrong with your registration")


if __name__ == '__main__':
    application = ApplicationBuilder().token(TELE_TOKEN_TEST).build()

    conversation_handler = ConversationHandler(
        entry_points=[
            CommandHandler('start', start),
            CommandHandler('cancel', cancel),
            CommandHandler('viewWalletBalance', view_wallet_balance),
            CommandHandler('viewTransactionHistory', view_transaction_history),
            CommandHandler('topUpWallet', top_up_wallet),
            CommandHandler('viewEvents', view_events),
            CommandHandler('checkRegistration', check_registration),
            CommandHandler('register', register_for_event),
            CommandHandler('showQR', show_QR),
            CommandHandler('redeem', redeem)
        ],
        states={
            NEW_USER: [MessageHandler(filters.Regex('^([A-Za-z ]+): ([0-9A-Za-z.+-]+)$'), register_new_user)],
            PROCEED_PAYMENT: [MessageHandler(filters.Regex('^(10|50|100)$'), proceed_payment)],
            TITLE: [MessageHandler(filters.TEXT, validate_registration)],
            VERIFY_BALANCE: [MessageHandler(filters.Regex('^(Yes|No)$'), verify_balance)],
            REDEEM: [MessageHandler(filters.TEXT, show_QR)]
        },
        fallbacks=[MessageHandler(filters.TEXT, unknown)]
    )
    application.add_handler(conversation_handler)
    application.add_handler(MessageHandler(filters.TEXT, unknown))
    application.add_handler(PreCheckoutQueryHandler(precheckout))
    application.add_handler(MessageHandler(
        filters.SUCCESSFUL_PAYMENT, successful_payment))
    application.add_error_handler(error_handler)

    application.run_polling()
