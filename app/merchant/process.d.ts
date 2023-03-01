declare namespace NodeJS {
	export interface ProcessEnv {
		NEXTAUTH_URL: string;
		NEXTAUTH_SECRET: string;
		TELEGRAM_BOT: string;
		WEB3AUTH_CLIENT_ID: string;
		FIREBASE_API_KEY: string;
		PINATA_JWT: string;
		API_BASE_URL: string;
	}
}