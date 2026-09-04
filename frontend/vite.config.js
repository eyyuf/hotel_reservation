import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const terminalReservationLogger = () => ({
  name: 'terminal-reservation-logger',
  configureServer(server) {
    server.middlewares.use('/__dev/reservation-log', (request, response, next) => {
      if (request.method !== 'POST') return next();

      let body = '';
      request.on('data', (chunk) => { body += chunk; });
      request.on('end', () => {
        try {
          console.log('\n[reservation test data]\n' + JSON.stringify(JSON.parse(body), null, 2));
          response.statusCode = 204;
        } catch {
          response.statusCode = 400;
        }
        response.end();
      });
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), terminalReservationLogger()],
})
