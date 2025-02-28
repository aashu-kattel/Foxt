// Font Cycling Plugin for After Effects
// This script automatically cycles through available font styles for selected text layers

(function() {
    var mainPanel = (this instanceof Panel) ? this : new Window("palette", "Font Cycler", undefined);
    mainPanel.orientation = "column";
    mainPanel.alignChildren = ["center", "top"];
    mainPanel.spacing = 10;
    mainPanel.margins = 16;

    var controlGroup = mainPanel.add("group", undefined, "Controls");
    controlGroup.orientation = "row";
    controlGroup.spacing = 10;

    var startButton = controlGroup.add("button", undefined, "Start Cycling");
    var stopButton = controlGroup.add("button", undefined, "Stop");
    stopButton.enabled = false;

    var intervalGroup = mainPanel.add("group");
    intervalGroup.orientation = "row";
    intervalGroup.spacing = 10;
    
    intervalGroup.add("statictext", undefined, "Change Interval (seconds):");
    var intervalInput = intervalGroup.add("edittext", undefined, "1.0");
    intervalInput.characters = 5;

    var statusText = mainPanel.add("statictext", undefined, "Ready to start");
    statusText.alignment = ["fill", "top"];

    var cycleTimer = null;
    var isRunning = false;
    var currentFontIndex = 0;
    
    function getSelectedTextLayers() {
        var textLayers = [];
        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem) {
            for (var i = 0; i < comp.selectedLayers.length; i++) {
                var layer = comp.selectedLayers[i];
                if (layer instanceof TextLayer) {
                    textLayers.push(layer);
                }
            }
        }
        return textLayers;
    }
    
    function cycleFonts() {
        app.beginUndoGroup("Cycle Fonts");
        try {
            var textLayers = getSelectedTextLayers();
            if (textLayers.length === 0) {
                statusText.text = "No text layers selected!";
                stopCycling();
                return;
            }
            
            var fontFamilies = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Tahoma", "Trebuchet MS"];
            var selectedFont = fontFamilies[currentFontIndex % fontFamilies.length];
            
            for (var i = 0; i < textLayers.length; i++) {
                var textProp = textLayers[i].property("Source Text");
                var textDocument = textProp.value;
                textDocument.font = selectedFont;
                textProp.setValue(textDocument);
            }
            
            statusText.text = "Applied: " + selectedFont;
            currentFontIndex++;
        } catch (err) {
            statusText.text = "Error: " + err.toString();
        }
        app.endUndoGroup();
    }
    
    $.global.cycleFonts = cycleFonts;
    
    function startCycling() {
        if (!isRunning) {
            var interval = parseFloat(intervalInput.text) * 1000;
            if (isNaN(interval) || interval <= 0) {
                alert("Please enter a valid interval greater than 0");
                return;
            }
            
            isRunning = true;
            startButton.enabled = false;
            stopButton.enabled = true;
            intervalInput.enabled = false;
            
            cycleFonts();
            cycleTimer = app.scheduleTask("$.global.cycleFonts()", interval, true);
            statusText.text = "Cycling fonts every " + intervalInput.text + " seconds";
        }
    }
    
    function stopCycling() {
        if (isRunning) {
            isRunning = false;
            startButton.enabled = true;
            stopButton.enabled = false;
            intervalInput.enabled = true;
            if (cycleTimer) {
                cycleTimer.cancel();
                cycleTimer = null;
            }
            statusText.text = "Font cycling stopped";
        }
    }
    
    startButton.onClick = startCycling;
    stopButton.onClick = stopCycling;
    
    if (!(this instanceof Panel)) {
        mainPanel.center();
        mainPanel.show();
    }
    
    return mainPanel;
}());