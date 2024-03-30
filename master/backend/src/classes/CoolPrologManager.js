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
                // Extract queries marked with '%?' from the cell code
                let queries = cell.code.split('\n').filter(line => line.trim().startsWith('%?')).map(line => line.trim().substring(2).trim());

                if (queries.length > 0) {
                    let results = [];
                    let processQuery = (index) => {
                        if (index < queries.length) {
                            this.session.query(queries[index], {
                                success: () => {
                                    this.session.answer(answer => {
                                        results.push(pl.format_answer(answer));
                                        processQuery(index + 1); // Move to the next query
                                    });
                                },
                                error: err => {
                                    results.push({ error: err.toString() });
                                    processQuery(index + 1); // Move to the next query even on error
                                }
                            });
                        } else {
                            callback({ results }); // Done processing all queries
                        }
                    };
                    processQuery(0); // Start processing queries
                } else {
                    callback({ results: [], message: 'No executable query in the cell' });
                }
            },
            error: err => callback({ error: err.toString() })
        });
    }

}

module.exports = CoolPrologManager;
