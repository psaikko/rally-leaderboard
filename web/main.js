import { api_url, rally_list, stage_lists } from "./config.js";

const tableColumnNames = ["player","time","splits","car","transmission"]

function makeRallyHeader(rally) {
    let header = document.createElement("h3");
    let flag = document.createElement("img");
    flag.src = `./assets/flags/${rally.toLowerCase()}.gif`;
    flag.width = 50;
    header.appendChild(flag);
    header.appendChild(document.createTextNode(rally));
    return header;
}

function getTableIdentifier(game, rally, stage) {
    return [game, rally, stage, "tablebody"].join("-").replace(/ /g,"_");
}

function makeStageTable(game, rally, stage) {
    let tableDiv = document.createElement("div");
    let tableName = document.createElement("h4");
    tableName.innerText = stage;
    let table = document.createElement("table");
    let tableHeader = document.createElement("thead");
    let tableHeaderRow = document.createElement("tr");
    tableColumnNames.forEach(colname => {
        let tableHeaderCell = document.createElement("th");
        tableHeaderCell.innerText = colname;
        tableHeaderRow.appendChild(tableHeaderCell);
    })
    let tableBody = document.createElement("tbody");
    tableBody.id = getTableIdentifier(game, rally, stage);
    
    tableHeader.appendChild(tableHeaderRow);
    table.appendChild(tableHeader);
    table.appendChild(tableBody);
    tableDiv.appendChild(tableName);
    tableDiv.appendChild(table);
    return tableDiv;
}

function makeRow(stagetime_data) {
    let row = document.createElement("tr");
    tableColumnNames.forEach(colname => {
        let cell = document.createElement("td")
        cell.innerText = stagetime_data[colname];
        row.appendChild(cell);
    });
    return row;
}

function createTables() {
    let cmr_root_element = document.getElementById("CMR-rallies");

    rally_list.forEach(rally => {
        const header = makeRallyHeader(rally);
        const table = makeStageTable("CMR", rally, "Rally");
        cmr_root_element.appendChild(header);
        cmr_root_element.appendChild(table);
    })
}

function formatTime(hundredths) {
    const minutes = hundredths / 6000 | 0;
    hundredths -= minutes * 6000;
    const seconds = hundredths / 100 | 0;
    hundredths -= seconds * 100;
    return `${minutes}:${seconds}.${hundredths}`;
}

function getSplitDiffs(splits) {
    for (let i = splits.length - 1; i > 0; --i) {
        splits[i] -= splits[i - 1];
    }
    return splits;
}

function preprocessRowData(stagetime_data) {
    stagetime_data["transmission"] = stagetime_data["manual"] ? "Manual" : "Automatic";
    stagetime_data["time"] = formatTime(stagetime_data["time"]);
    stagetime_data["splits"] = getSplitDiffs(stagetime_data["splits"])
    stagetime_data["splits"] = stagetime_data["splits"].map(formatTime);
    return stagetime_data;
}

async function fetchRallyTimes(rally) {
    const response = await fetch(api_url + `/CMR/${rally}/Rally`);
    if (response.status === 200) {
        const data = await response.json();
        return Promise.resolve(data);
    } else {
        return Promise.reject(Error(response.status));
    }
}

async function loadRallies() {
    
    let rally_queries = rally_list.map(fetchRallyTimes)

    let rally_data = await Promise.all(rally_queries)

    for (let i = 0; i < rally_list.length; ++i) {
        const rally = rally_list[i];
        let rally_times = rally_data[i];
        
        console.log(rally);
        console.log(rally_times);

        let rallyTable = document.getElementById(getTableIdentifier("CMR", rally, "Rally"));
        rally_times.forEach(stagetime_data => {
            console.log(stagetime_data);
            rallyTable.appendChild(makeRow(preprocessRowData(stagetime_data)));
        });
    }
}

createTables();
loadRallies()
    .then(() => console.log("OK"))
    .catch(() => console.log("ERROR"));