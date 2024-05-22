/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        API_URL: process.env.API_URL || 'http://localhost:3000/api',
        SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3000',
        BUCKET_NAME: process.env.BUCKET_NAME || 'my-bucket-name',
    },
};

export default nextConfig;
