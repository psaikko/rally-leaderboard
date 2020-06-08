import { apiUrl, rallyList, stageLists } from "./config.js";
import { ENode, TNode } from "../domppa.js"

const tableColumnNames = ["#","player","time","sectors","car","transmission"]

let stagesLoaded = {};
rallyList.forEach(rally => {
    stagesLoaded[rally] = {};
});

function makeRallyHeader(rally) {
    return ENode(
        "h3",
        [],
        [
            ENode(
                "img",
                [
                    ["src", `./assets/flags/${rally.toLowerCase()}.gif`],
                    ["width", 50]
                ]
            ),
            TNode(rally),
        ]
    );
}

function makeTableBodyId(game, rally, stage) {
    return [game, rally, stage, "tablebody"].join("-").replace(/ /g,"_");
}

function makeTableId(game, rally, stage) {
    return [game, rally, stage, "table"].join("-").replace(/ /g,"_");
}

function makeStageTable(game, rally, stage) {
    const tblClass = stagename => {
        if (stagename === "Rally") return "rally-table";
        if (stagename === "Super-Special") return "ss-table hidden";
        return "stage-table hidden";
    }

    return ENode("table",
        [
            ["id", makeTableId(game, rally, stage)],
            ["class", tblClass(stage)],
        ],
        [
            ENode(
                "thead",
                [],
                tableColumnNames.map(colname => ENode(
                    "th",
                    [["class", colname+"-column"]],
                    [TNode(colname)]
                ))
            ),
            ENode(
                "tbody",
                [["id", makeTableBodyId(game, rally, stage)]],
                [ENode(
                    "tr", 
                    [],
                    [ENode(
                        "td",
                        [["colspan", tableColumnNames.length]],
                        [TNode("Loading...")]
                    )]
                )]
            )
        ]
    );
}

function makeRow(stageTimeData) {
    return ENode(
        "tr",
        [],
        tableColumnNames.map(colname => ENode(
            "td", 
            [["class", colname+"-column"]],
            colname === "sectors" ?
                stageTimeData[colname].map(s => ENode(
                    "span", 
                    [["class", "sector-span" + ((s < 0) ? " best-sector" : "")]], 
                    [TNode(formatTime(Math.abs(s)))]
                )) : 
                [TNode(stageTimeData[colname])]
        ))
    );
}

function makeStagesList(rally) {
    return ENode("div",
        [],
        [
            ENode("h4", [], [TNode("Stages")]),
            ENode(
                "ol",
                [["class", "stages-list"]],
                stageLists[rally].map(stagename => {
                    var table = makeStageTable("CMR",rally,stagename);
                    var listitem = ENode(
                        "li",
                        [["class", "stage-name"]],
                        [
                            TNode(stagename),
                            table
                        ]
                    )
                    listitem.addEventListener('click', e => {
                        const hidden = table.classList.toggle("hidden");
                        if (!hidden) {
                            loadStageData(rally, stagename);
                        }
                    })
                    return listitem;
                })
            )
        ]
    );
}

function makeRallyBlocks() {
    let cmrRootElement = document.getElementById("CMR-rallies");

    rallyList.forEach(rally => {
        cmrRootElement.appendChild(
            ENode(
                "div",
                [
                    ["id", `${rally}-block`],
                    ["class", "rally-block"]
                ],
                [
                    makeRallyHeader(rally),
                    ENode(
                        "div",
                        [],
                        [
                            ENode("h4", [], [TNode("Rally")]),
                            makeStageTable("CMR", rally, "Rally"),
                        ]
                    ),
                    makeStagesList(rally)
                ]
            )
        );
    });
}

function formatTime(hundredths) {
    const pad2 = (p, x) => (x < 10 ? p : "") + x;

    const minutes = hundredths / 6000 | 0;
    hundredths %= 6000;
    const seconds = hundredths / 100 | 0;
    hundredths %= 100;
    return `${minutes ? pad2("!", minutes)+":" : ""}${pad2("0", seconds)}.${pad2("0", hundredths)}`;
}

function getSectors(splits) {
    for (let i = splits.length - 1; i > 0; --i) {
        splits[i] -= splits[i - 1];
    }
    return splits;
}

function preprocessStageData(stageTimesData) {

    stageTimesData.forEach((stageTimeData, i) => {
        stageTimeData["#"] = i+1;
        stageTimeData["transmission"] = stageTimeData["manual"] ? "Manual" : "Automatic";
        stageTimeData["time"] = formatTime(stageTimeData["time"]);
        stageTimeData["sectors"] = getSectors(stageTimeData["splits"])
    })

    // Find and mark global best sector times
    const n_sectors = stageTimesData[0]["sectors"].length;
    if (n_sectors > 1) {
        // for each sector find entry with best time
        let best_sectors_i = new Array(n_sectors);
        let best_sectors_t = new Array(n_sectors);
        for (let sector_i = 0; sector_i < n_sectors; ++sector_i) {
            best_sectors_i[sector_i] = 0;
            best_sectors_t[sector_i] = stageTimesData[0]["sectors"][sector_i];

            for (let times_i = 1; times_i < stageTimesData.length; ++times_i) {
                const sector_time = stageTimesData[times_i]["sectors"][sector_i];
                if (sector_time < best_sectors_t[sector_i]) {
                    best_sectors_t[sector_i] = sector_time;
                    best_sectors_i[sector_i] = times_i;
                }
            }
        }

        // mark best sector time with negative number
        for (let sector_i = 0; sector_i < n_sectors; ++sector_i) {
            stageTimesData[best_sectors_i[sector_i]]["sectors"][sector_i] *= -1;
        }
    }
    return stageTimesData;
}

async function fetchRallyTimes(rally) {
    return await fetchStageTimes(rally, "Rally");
}

async function fetchStageTimes(rally, stage) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const response = await fetch(apiUrl + `/CMR/${rally}/${stage}`);
    if (response.status === 200) {
        const data = await response.json();
        return Promise.resolve(data);
    } else {
        return Promise.reject(Error(response.status));
    }
}

function updateTableData(rally, stage, data) {
    let tablebody = document.getElementById(makeTableBodyId('CMR', rally, stage));
    tablebody.innerText = '';

    preprocessStageData(data).forEach((stageTimeData) => {
        tablebody.appendChild(makeRow(stageTimeData));
    });
}

async function loadStageData(rally, stage) {
    if (!stagesLoaded[rally][stage]) {
        const stageTimes = await fetchStageTimes(rally, stage);
        updateTableData(rally, stage, stageTimes);
        stagesLoaded[rally][stage] = true;
    }
}

async function loadRalliesData() {
    let rallyQueries = rallyList.map(fetchRallyTimes)
    let rallyData = await Promise.all(rallyQueries)
    for (let i = 0; i < rallyList.length; ++i) {
        const rally = rallyList[i];
        let rallyTimes = rallyData[i];
        updateTableData(rally, "Rally", rallyTimes);
    }
}

makeRallyBlocks();
loadRalliesData()
    .then(() => console.log("OK"))
    .catch(() => console.log("ERROR"));