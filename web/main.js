import { api_url, rally_list, stage_lists } from "./config.js";
import { ENode, TNode } from "./domppa.js"

const tableColumnNames = ["player","time","splits","car","transmission"]

let stages_loaded = {};
rally_list.forEach(rally => {
    stages_loaded[rally] = {};
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

function makeStageTable(game, rally, stage, ...attributes) {
    return ENode("table",
        [["id", makeTableId(game, rally, stage)], ...attributes],
        [
            ENode(
                "thead",
                [],
                tableColumnNames.map(colname => ENode(
                    "th",
                    [],
                    [TNode(colname)]
                ))
            ),
            ENode(
                "tbody",
                [["id", makeTableBodyId(game, rally, stage)]]
            )
        ]
    );
}

function makeRow(stagetime_data) {
    return ENode(
        "tr",
        [],
        tableColumnNames.map(colname => ENode(
            "td", 
            [["class", (colname === "time" || colname === "splits") ? "timing" : ""]],
            [TNode(stagetime_data[colname])]
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
                stage_lists[rally].map(stagename => {
                    var table = makeStageTable("CMR",rally,stagename,["class","hidden"]);
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
    let cmr_root_element = document.getElementById("CMR-rallies");

    rally_list.forEach(rally => {
        cmr_root_element.appendChild(
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
    return `${pad2("!", minutes)}:${pad2("0", seconds)}.${pad2("0", hundredths)}`;
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
    return await fetchStageTimes(rally, "Rally");
}

async function fetchStageTimes(rally, stage) {
    const response = await fetch(api_url + `/CMR/${rally}/${stage}`);
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
    data.forEach(stagetime_data => {
        tablebody.appendChild(makeRow(preprocessRowData(stagetime_data)));
    });
}

async function loadStageData(rally, stage) {
    if (!stages_loaded[rally][stage]) {
        const stageTimes = await fetchStageTimes(rally, stage);
        updateTableData(rally, stage, stageTimes);
        stages_loaded[rally][stage] = true;
    }
}

async function loadRalliesData() {
    let rally_queries = rally_list.map(fetchRallyTimes)
    let rally_data = await Promise.all(rally_queries)
    for (let i = 0; i < rally_list.length; ++i) {
        const rally = rally_list[i];
        let rally_times = rally_data[i];
        updateTableData(rally, "Rally", rally_times);
    }
}

makeRallyBlocks();
loadRalliesData()
    .then(() => console.log("OK"))
    .catch(() => console.log("ERROR"));