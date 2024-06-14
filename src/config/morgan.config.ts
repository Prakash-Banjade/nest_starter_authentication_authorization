import { INestApplication } from "@nestjs/common";
import morgan from 'morgan';
import logger from "src/logger";

const morganFormat = ':method :url :status :response-time ms';

export function setupMorgan(app: INestApplication): void {
    app.use(morgan(morganFormat, {
        stream: {
            write: (message: any) => {
                const logObject = {
                    method: message.split(' ')[0],
                    url: message.split(' ')[1],
                    status: message.split(' ')[2],
                    responseTime: message.split(' ')[3],

                };
                
                logger.info(JSON.stringify(logObject));
            }
        }
    }));
}