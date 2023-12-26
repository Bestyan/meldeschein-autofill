import contentScriptConnector from "./content-script-connector";

export default {
  /**
   * triggers the tmanager content script to select the predefined items
   */
  fillTManager: () => {
    const season = document.getElementById("tmanager_season").value;
    contentScriptConnector.send({
      from: `${season}-05-01`,
      to: `${+season + 1}-04-30`
    });
  }
}