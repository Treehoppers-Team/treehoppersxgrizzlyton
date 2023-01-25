declare namespace NodeJS {
	export interface ProcessEnv {
		NEXTAUTH_URL: string;
		NEXTAUTH_SECRET: string;
		BOT_TOKEN: string;
		BOT_USERNAME: string;
		WEB3AUTH_CLIENT_ID: string;
		FIREBASE_API_KEY: string;
	}
}