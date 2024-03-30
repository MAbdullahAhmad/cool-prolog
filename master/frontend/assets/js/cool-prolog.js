let cellIdCounter = 0;
let cellsData = {};

document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace');
    const createCellButton = document.getElementById('createCell');

    createCellButton.addEventListener('click', () => {
        const cell = createCell();
        workspace.insertBefore(cell, createCellButton);
        cell.querySelector('.cell-input').focus();
    });
});
function createCell() {
    const cellId = cellIdCounter++;
    cellsData[cellId] = { content: '', modified: false };

    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.cellId = cellId;

    const textArea = document.createElement('textarea');
    textArea.className = 'cell-input';
    textArea.style.overflowY = 'auto'; // Ensure only vertical scrollbar
    textArea.style.resize = 'vertical'; // Allow only vertical resizing

    // Function to adjust textarea height
    const adjustHeight = () => {
        textArea.style.height = 'auto'; // Reset height to calculate new scrollHeight
        textArea.style.height = `${Math.min(textArea.scrollHeight, 500)}px`;
    };

    // Initialize height and adjust on input
    adjustHeight();
    textArea.addEventListener('input', () => {
        cellsData[cellId].content = textArea.value;
        cellsData[cellId].modified = true;
        adjustHeight();
    });

    cell.appendChild(textArea);

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'cell-controls';

    const runButton = document.createElement('button');
    runButton.className = 'control-button run';
    runButton.innerHTML = '<i class="fas fa-play"></i>';
    runButton.addEventListener('click', () => {
        executePrologCode(cellId, textArea, cell.querySelector('.cell-output'));
    });
    controlsDiv.appendChild(runButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'control-button delete';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener('click', () => {
        delete cellsData[cellId];
        cell.remove();
    });
    controlsDiv.appendChild(deleteButton);

    const outputDiv = document.createElement('div');
    outputDiv.className = 'cell-output';
    cell.appendChild(controlsDiv);
    cell.appendChild(outputDiv);

    return cell;
}



function executePrologCode(cellId, textArea, outputDiv) {
    if (!cellsData[cellId].modified) {
        console.log(`No changes in cell ${cellId} to execute`);
        return;
    }

    const prologCode = textArea.value;
    fetch('http://localhost:3005/api/exec', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cellId, prologCode })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            outputDiv.textContent = data.error;
            outputDiv.className = 'cell-output output-error';
        } else {
            // Directly mapping the results assuming they are just an array of strings
            const allResults = data.results.join('\n');
            outputDiv.textContent = allResults;
            outputDiv.className = 'cell-output output-success';
        }
        cellsData[cellId].modified = false;  // Reset modified flag after execution
    })
    .catch(error => {
        outputDiv.textContent = 'Error: ' + error.message;
        outputDiv.className = 'cell-output output-error';
    });
}

