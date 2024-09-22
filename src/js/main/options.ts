import "../../css/options.css";
import { Database } from './database/database';
import { OptionsController } from "./options/controller";
import UI from "./options/ui";

const database = new Database(window);
const controller = new OptionsController(database);
const ui = new UI(controller);

/**
 * initialize all the sections
 */
ui.initCheckinDocumentUI();
ui.initKeysUI();
ui.initEmailTemplatesUI();
ui.initWlanVoucherUI();
