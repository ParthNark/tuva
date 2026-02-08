/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		VITE_AUTH0_DOMAIN: process.env.VITE_AUTH0_DOMAIN,
		VITE_AUTH0_CLIENT_ID: process.env.VITE_AUTH0_CLIENT_ID,
		VITE_AUTH0_AUDIENCE: process.env.VITE_AUTH0_AUDIENCE,
	},
};

module.exports = nextConfig;
