import { INestApplication } from "@nestjs/common";
import morgan from 'morgan';
import logger from "src/logger";

const morganFormat = ':method :url :status :response-time ms';

export function setupMorgan(app: INestApplication): void {
    app.use(morgan(morganFormat, {
        stream: {
            write: (message: string) => {
                const splitMsg = message.trim().split(' ');
                const logMsg = `${splitMsg[0]}\t${splitMsg[1]}\t${splitMsg[2]}\t${splitMsg[3]}`;

                logger.info(logMsg);
            }
        }
    }));
}
