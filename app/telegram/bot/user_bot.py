import logging
import json
import pyqrcode
import requests
import datetime
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
from sys import platform

load_dotenv()

# Environment Variables
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

NEW_USER, PROCEED_PAYMENT = range(2)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "/viewWalletBalance - View the current Balance of your Mynt wallet\n"
        "/viewTransactionHistory - View all transactions for your Mynt wallet\n"
        "/topUpWallet - Top up your Mynt wallet\n\n"
        "/viewEvents - View all ongoing events\n"
        "/register - Register for an ongoing event \n"
        "/checkRegistration - View registration status (pending/successful/unsuccessful) for an event \n"
        "/redeem - Redeem your ticket at the event venue\n"
        "/showQR - show your QR code"
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

            text += f"Transaction Type: *{transaction_type}*\n" \
                f"Amount: ${amount}\n" \
                f"Time: {time}\n\n"
    else:
        text = "You have no prior transactions"
    await update.message.reply_text(text, parse_mode='Markdown')
    return ConversationHandler.END

""""
=============================================================================================
show_QR: Generate a QR Code (should be integrated with redeem)
=============================================================================================
"""

async def show_QR(update: Update, context: ContextTypes.DEFAULT_TYPE):
    username = update.message.from_user.username
    await update.message.reply_text(f'Your wallet belongs to {username}')
    url = pyqrcode.create(f'https://t.me/{username}')
    url.png(f'./qr_codes/{username}.png', scale=6)
    await update.message.reply_photo(f'./qr_codes/{username}.png')
    # add code to delete photo as well
    current_path = os.getcwd()
    if platform != 'darwin': #windows
      picture_path = current_path + f'\qr_codes\{username}.png'
    else: #mac or linux
      picture_path = current_path + f'/qr_codes/{username}.png'
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
    reply_keyboard = [[10, 50, 100]]
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
    response = requests.post(endpoint_url + "/insertPayment", json=data)
    if response.status_code == 200:
        await update.message.reply_text(f"You have successfully topped up ${topup_amount}!")
    return ConversationHandler.END


if __name__ == '__main__':
    application = ApplicationBuilder().token(TELE_TOKEN_TEST).build()

    conversation_handler = ConversationHandler(
        entry_points=[
            CommandHandler('start', start),
            CommandHandler('cancel', cancel),
            CommandHandler('viewWalletBalance', view_wallet_balance),
            CommandHandler('viewTransactionHistory', view_transaction_history),
            CommandHandler('topUpWallet', top_up_wallet), 
            CommandHandler('showQR', show_QR)
        ],
        states={
            NEW_USER: [MessageHandler(filters.Regex('^([A-Za-z ]+): ([0-9A-Za-z.+-]+)$'), register_new_user)],
            PROCEED_PAYMENT: [MessageHandler(filters.Regex('^(10|50|100)$'), proceed_payment)]
        },
        fallbacks=[MessageHandler(filters.TEXT, unknown)]
    )
    application.add_handler(conversation_handler)
    application.add_handler(MessageHandler(filters.TEXT, unknown))
    application.add_handler(PreCheckoutQueryHandler(precheckout))
    application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment))

    application.run_polling()
