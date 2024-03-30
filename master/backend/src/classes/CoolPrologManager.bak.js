const fs = require('fs');
const path = require('path');
const pl = require('tau-prolog');

class CoolPrologManager {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.session = pl.create(1000); // Create a single Prolog session per manager instance
        this.sessionDirectory = path.join(__dirname, '..', 'sessions', 'prolog', this.sessionId);
        this.cellsDataFile = path.join(this.sessionDirectory, 'cells-data.json');
        this.ensureDirectoryAndFile();
    }

    ensureDirectoryAndFile() {
        fs.mkdirSync(this.sessionDirectory, { recursive: true });
        if (!fs.existsSync(this.cellsDataFile)) {
            fs.writeFileSync(this.cellsDataFile, JSON.stringify({ cells: {} }));
        }
    }

    updateCellData(cellId, prologCode, callback) {
        const data = JSON.parse(fs.readFileSync(this.cellsDataFile, 'utf8'));
        let cellUpdated = false;

        if (!data.cells[cellId] || data.cells[cellId].code !== prologCode) {
            data.cells[cellId] = { code: prologCode, lastModified: new Date().toISOString() };
            fs.writeFileSync(this.cellsDataFile, JSON.stringify(data));
            cellUpdated = true;
        }

        callback(cellUpdated);
    }

    runPrologCodeForCell(cellId, callback) {
        const data = JSON.parse(fs.readFileSync(this.cellsDataFile, 'utf8'));
        const cell = data.cells[cellId];

        if (!cell) return callback({ error: 'Cell not found' });

        // Build the complete program from all cells to maintain the context
        let program = Object.values(data.cells).map(c => c.code).join('\n');

        this.session.consult(program, {
            success: () => {
                let query = cell.code.trim().split('\n').find(line => line.startsWith('?- '));
                if (query) {
                    query = query.substring(3); // Remove '?- ' prefix to get the actual query
                    this.session.query(query, {
                        success: () => {
                            const answers = [];
                            const collectAnswers = () => {
                                this.session.answer(answer => {
                                    if (pl.type.is_success(answer) || pl.type.is_error(answer)) {
                                        answers.push(pl.format_answer(answer));
                                        collectAnswers(); // Recursively collect all answers
                                    } else {
                                        callback({ results: answers });
                                    }
                                });
                            };
                            collectAnswers();
                        },
                        error: err => callback({ error: err.toString() })
                    });
                } else {
                    callback({ results: [], message: 'No executable query in the cell' });
                }
            },
            error: err => callback({ error: err.toString() })
        });
    }
}

module.exports = CoolPrologManager;
