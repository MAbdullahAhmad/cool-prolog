const CoolPrologManager = require('../classes/CoolPrologManager');

const PrologController = {
    sync: (req, res) => {
        res.json({ success: true });
    },

    exec: (req, res) => {
        const { cellId, prologCode } = req.body;
        const prologManager = new CoolPrologManager(req.sessionID);

        prologManager.updateCellData(cellId, prologCode, (cellUpdated) => {
            if (cellUpdated) {
                prologManager.runPrologCodeForCell(cellId, (results) => {
                    res.json(results);
                });
            } else {
                res.json({ results: [], message: 'No changes in cell to execute' });
            }
        });
    }
};

module.exports = PrologController;
