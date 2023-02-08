import logging
import json
import pyqrcode
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
view_wallet_balance: Display balance of in-app wallet
=============================================================================================
"""
async def view_wallet_balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    response = requests.get(endpoint_url + f"/viewWalletBalance/{user_id}")
    response_data = response.json()
    user_balance = response_data['balance']
    await update.message.reply_text(f'Your wallet balance is ${user_balance}')
    return ConversationHandler.END

async def view_transaction_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    response = requests.get(endpoint_url + f"/viewTransactionHistory/{user_id}")
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
view_wallet: Display in-app wallet (should eventually be integrated with viewwalletBalance, viewTransactionHistory and TopUp Wallet ), needs to be web app (either created in react etc)
=============================================================================================
"""

async def view_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE):
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

if __name__ == '__main__':
    application = ApplicationBuilder().token(TELE_TOKEN_TEST).build()

    conversation_handler = ConversationHandler(
        entry_points=[
            CommandHandler('start', start),
            CommandHandler('cancel', cancel),
            CommandHandler('viewWalletBalance', view_wallet_balance),
            CommandHandler('viewTransactionHistory', view_transaction_history),
            CommandHandler('showQR', show_QR)
        ],
        states={
        },
        fallbacks=[MessageHandler(filters.TEXT, unknown)]
    )
    application.add_handler(conversation_handler)
    application.add_handler(MessageHandler(filters.TEXT, unknown))

    application.run_polling()