
const tabsList = document.getElementById("tabsList");
const tabCount = document.getElementById("tabCount");
const searchInput = document.getElementById("searchInput");

const groupNameInput = document.getElementById("groupNameInput");
const groupColorInput = document.getElementById("groupColorInput");
const createGroupButton = document.getElementById("createGroupButton");
const groupStatus = document.getElementById("groupStatus");

const groupsList = document.getElementById("groupsList");
const groupCount = document.getElementById("groupCount");

const savedGroupsList = document.getElementById("savedGroupsList");
const savedGroupCount = document.getElementById("savedGroupCount");

const findSuggestionsButton =
    document.getElementById("findSuggestionsButton");
const suggestionsList =
    document.getElementById("suggestionsList");

const scanDuplicatesButton =
    document.getElementById("scanDuplicatesButton");
const duplicatesList =
    document.getElementById("duplicatesList");
const duplicateStatus =
    document.getElementById("duplicateStatus");

let allTabs = [];
let allGroups = [];
let selectedTabIds = new Set();

let dismissedDomains = new Set();

const groupColors = {
    blue: "#4a90e2",
    red: "#e74c3c",
    green: "#27ae60",
    yellow: "#f1c40f",
    purple: "#9b59b6",
    pink: "#e84393",
    cyan: "#00cec9",
    orange: "#e67e22",
    grey: "#7f8c8d"
};

const multiPartDomainSuffixes = new Set([
    "co.uk", "org.uk", "ac.uk", "gov.uk",
    "com.au", "net.au", "org.au", "edu.au",
    "co.in", "firm.in", "net.in", "org.in",
    "gen.in", "com.pk", "net.pk", "org.pk",
    "edu.pk", "gov.pk", "co.nz", "org.nz",
    "net.nz", "com.br", "com.cn", "com.sg",
    "com.my", "com.tr", "co.za", "com.mx",
    "com.tw", "com.hk", "co.jp"
]);

// Extract the main website domain from a URL
function getDomain(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase();

        if (
            !hostname ||
            hostname === "localhost" ||
            !hostname.includes(".")
        ) {
            return null;
        }

        const cleanHostname = hostname.startsWith("www.")
            ? hostname.slice(4)
            : hostname;

        const parts = cleanHostname.split(".");

        if (parts.length < 2) {
            return null;
        }

        const lastTwoParts = parts.slice(-2).join(".");

        if (multiPartDomainSuffixes.has(lastTwoParts)) {
            return parts.length >= 3
                ? parts.slice(-3).join(".")
                : cleanHostname;
        }

        return parts.slice(-2).join(".");

    } catch (error) {
        return null;
    }
}

// Automatically select a color based on website category
function getSuggestedColor(domain) {
    const colorCategories = {
        blue: ["google.com"],

        red: [
            "youtube.com",
            "netflix.com",
            "twitch.tv"
        ],

        pink: [
            "facebook.com",
            "instagram.com",
            "tiktok.com",
            "x.com",
            "twitter.com",
            "linkedin.com",
            "pinterest.com",
            "reddit.com"
        ],

        purple: [
            "github.com",
            "gitlab.com",
            "stackoverflow.com",
            "npmjs.com",
            "developer.mozilla.org",
            "vercel.com",
            "stackoverflow.co"
        ]
    };

    for (const [color, domains] of Object.entries(colorCategories)) {
        if (domains.includes(domain)) {
            return color;
        }
    }

    return "green";
}

// Find websites with multiple ungrouped open tabs
function findDomainSuggestions() {
    const domainMap = {};

    const ungroupedTabs = allTabs.filter(
        (tab) => tab.groupId === -1
    );

    ungroupedTabs.forEach((tab) => {
        const domain = getDomain(tab.url || "");

        if (!domain) {
            return;
        }

        if (!domainMap[domain]) {
            domainMap[domain] = [];
        }

        domainMap[domain].push(tab);
    });

    return Object.entries(domainMap)
        .filter(([domain, tabs]) => tabs.length >= 2)
        .map(([domain, tabs]) => ({
            domain,
            tabs,
            color: getSuggestedColor(domain)
        }));
}

// Display automatic suggestions
function displaySuggestions(suggestions) {
    suggestionsList.innerHTML = "";

    const visibleSuggestions = suggestions.filter(
        (suggestion) => !dismissedDomains.has(suggestion.domain)
    );

    if (visibleSuggestions.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";

        message.textContent = suggestions.length === 0
            ? "No suggestions found. Open multiple ungrouped tabs from the same website."
            : "No suggestions to show. All current suggestions have been dismissed.";

        suggestionsList.appendChild(message);
        return;
    }

    visibleSuggestions.forEach((suggestion) => {
        const card = document.createElement("div");
        card.className = "suggestion-card";

        const heading = document.createElement("div");
        heading.className = "suggestion-heading";

        const domainName = document.createElement("strong");
        domainName.textContent = suggestion.domain;

        const count = document.createElement("span");
        count.textContent = `${suggestion.tabs.length} tabs`;

        heading.append(domainName, count);

        const colorInfo = document.createElement("div");
        colorInfo.style.display = "flex";
        colorInfo.style.alignItems = "center";
        colorInfo.style.gap = "7px";
        colorInfo.style.margin = "8px 0";

        const colorDot = document.createElement("span");
        colorDot.className = "group-color-dot";
        colorDot.style.backgroundColor =
            groupColors[suggestion.color];

        const colorText = document.createElement("span");
        colorText.textContent =
            `Suggested color: ${suggestion.color.charAt(0).toUpperCase() + suggestion.color.slice(1)}`;

        colorInfo.append(colorDot, colorText);

        const tabPreview = document.createElement("div");
        tabPreview.className = "suggestion-tabs";

        suggestion.tabs.forEach((tab) => {
            const tabName = document.createElement("p");
            tabName.textContent = tab.title || "Untitled Tab";
            tabPreview.appendChild(tabName);
        });

        const actions = document.createElement("div");
        actions.className = "suggestion-actions";

        const createButton = document.createElement("button");
        createButton.textContent = "Create Group";

        createButton.addEventListener("click", async () => {
            await createSuggestedGroup(suggestion);
        });

        const dismissButton = document.createElement("button");
        dismissButton.textContent = "Dismiss";
        dismissButton.className = "dismiss-suggestion-button";

        dismissButton.addEventListener("click", () => {
            dismissedDomains.add(suggestion.domain);
            displaySuggestions(suggestions);
        });

        actions.append(createButton, dismissButton);

        card.append(
            heading,
            colorInfo,
            tabPreview,
            actions
        );

        suggestionsList.appendChild(card);
    });
}

// Create a Firefox group from a suggestion
async function createSuggestedGroup(suggestion) {
    try {
        const permission = await browser.permissions.request({
            permissions: ["tabGroups"]
        });

        if (!permission) {
            groupStatus.textContent =
                "Tab Groups permission was not granted.";
            return;
        }

        const currentTabs = await browser.tabs.query({});

        const currentTabsById = new Map(
            currentTabs.map((tab) => [tab.id, tab])
        );

        const validTabs = suggestion.tabs
            .map((suggestedTab) =>
                currentTabsById.get(suggestedTab.id)
            )
            .filter((tab) =>
                tab &&
                tab.groupId === -1 &&
                getDomain(tab.url || "") === suggestion.domain
            );

        if (validTabs.length < 2) {
            groupStatus.textContent =
                "Not enough matching ungrouped tabs remain open.";
            return;
        }

        const windowIds = new Set(
            validTabs.map((tab) => tab.windowId)
        );

        if (windowIds.size !== 1) {
            groupStatus.textContent =
                "These tabs are in different windows. Move them into one window first.";
            return;
        }

        const groupId = await browser.tabs.group({
            tabIds: validTabs.map((tab) => tab.id)
        });

        await browser.tabGroups.update(groupId, {
            title: suggestion.domain,
            color: suggestion.color
        });

        groupStatus.textContent =
            `Created ${suggestion.domain} group with ${suggestion.color} color!`;

        await loadTabs();

        displaySuggestions(findDomainSuggestions());

    } catch (error) {
        console.error("Suggested group error:", error);
        groupStatus.textContent =
            "Could not create group: " + error.message;
    }
}

// Find tabs with exactly matching URLs
function findDuplicateTabs() {
    const urlMap = new Map();

    allTabs.forEach((tab) => {
        const url = tab.url;

        if (!url) {
            return;
        }

        if (!urlMap.has(url)) {
            urlMap.set(url, []);
        }

        urlMap.get(url).push(tab);
    });

    return Array.from(urlMap.entries())
        .filter(([url, tabs]) => tabs.length > 1)
        .map(([url, tabs]) => ({
            url,
            tabs
        }));
}

// Display duplicate tabs
function displayDuplicates(duplicateGroups) {
    duplicatesList.innerHTML = "";

    if (duplicateGroups.length === 0) {
        duplicatesList.innerHTML =
            '<p class="empty-message">No duplicate tabs found!</p>';

        duplicateStatus.textContent =
            "Your open tabs look good.";

        return;
    }

    const totalDuplicates = duplicateGroups.reduce(
        (total, group) => total + group.tabs.length - 1,
        0
    );

    duplicateStatus.textContent =
        `Found ${duplicateGroups.length} duplicate URL groups and ${totalDuplicates} extra tabs.`;

    duplicateGroups.forEach((duplicateGroup) => {
        const card = document.createElement("div");
        card.className = "duplicate-card";

        const heading = document.createElement("strong");
        heading.textContent =
            `${duplicateGroup.tabs.length} copies of this page`;

        const urlText = document.createElement("p");
        urlText.className = "duplicate-url";
        urlText.textContent = duplicateGroup.url;

        card.append(heading, urlText);

        duplicateGroup.tabs.forEach((tab, index) => {
            const tabRow = document.createElement("div");
            tabRow.className = "duplicate-tab-row";

            const tabInfo = document.createElement("span");
            tabInfo.textContent =
                `${index === 0 ? "Keep" : "Duplicate"}: ${tab.title || "Untitled Tab"}`;

            tabInfo.title = tab.url;

            const actions = document.createElement("div");
            actions.className = "duplicate-tab-actions";

            const switchButton = document.createElement("button");
            switchButton.textContent = "Open";

            switchButton.addEventListener("click", () => {
                browser.tabs.update(tab.id, {
                    active: true
                });
            });

            actions.appendChild(switchButton);

            if (index > 0) {
                const closeButton = document.createElement("button");
                closeButton.textContent = "Close";
                closeButton.className = "delete-saved-button";

                closeButton.addEventListener("click", async () => {
                    try {
                        await browser.tabs.remove(tab.id);

                        duplicateStatus.textContent =
                            "Duplicate tab closed.";

                        await loadTabs();

                        const updatedDuplicates = findDuplicateTabs();
                        displayDuplicates(updatedDuplicates);

                    } catch (error) {
                        console.error("Closing duplicate error:", error);
                        duplicateStatus.textContent =
                            "Could not close tab: " + error.message;
                    }
                });

                actions.appendChild(closeButton);
            }

            tabRow.append(tabInfo, actions);
            card.appendChild(tabRow);
        });

        duplicatesList.appendChild(card);
    });
}

// Scan current tabs for duplicates
async function scanDuplicates() {
    try {
        duplicateStatus.textContent = "Scanning open tabs...";

        allTabs = await browser.tabs.query({});

        const duplicateGroups = findDuplicateTabs();

        displayDuplicates(duplicateGroups);

    } catch (error) {
        console.error("Duplicate scan error:", error);

        duplicateStatus.textContent =
            "Could not scan tabs: " + error.message;
    }
}

// Display all open tabs
function displayTabs(tabs) {
    tabsList.innerHTML = "";

    if (tabs.length === 0) {
        tabsList.textContent = "No tabs found.";
        return;
    }

    tabs.forEach((tab) => {
        const tabItem = document.createElement("div");
        tabItem.className = "tab-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedTabIds.has(tab.id);

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedTabIds.add(tab.id);
            } else {
                selectedTabIds.delete(tab.id);
            }
        });

        const title = document.createElement("span");
        title.className = "tab-title";
        title.textContent = tab.title || "Untitled Tab";
        title.title = tab.url || "";

        title.addEventListener("click", () => {
            browser.tabs.update(tab.id, { active: true });
        });

        const closeButton = document.createElement("button");
        closeButton.textContent = "×";
        closeButton.className = "close-tab-button";

        closeButton.addEventListener("click", async () => {
            await browser.tabs.remove(tab.id);
            selectedTabIds.delete(tab.id);
            loadTabs();
        });

        tabItem.append(checkbox, title, closeButton);
        tabsList.appendChild(tabItem);
    });
}

// Search tabs
function filterTabs() {
    const searchText = searchInput.value.toLowerCase();

    const filteredTabs = allTabs.filter((tab) => {
        return (
            (tab.title || "").toLowerCase().includes(searchText) ||
            (tab.url || "").toLowerCase().includes(searchText)
        );
    });

    displayTabs(filteredTabs);
}

// Rename group
async function renameGroup(group) {
    const input = document.getElementById(`rename-input-${group.id}`);
    const newName = input.value.trim();

    if (!newName) return;

    try {
        await browser.tabGroups.update(group.id, {
            title: newName
        });

        await loadGroups();
    } catch (error) {
        console.error("Rename error:", error);
    }
}

// Change group color
async function changeGroupColor(group, color) {
    try {
        await browser.tabGroups.update(group.id, {
            color: color
        });

        await loadGroups();
    } catch (error) {
        console.error("Color update error:", error);
    }
}

// Ungroup tab
async function ungroupTab(tab) {
    try {
        await browser.tabs.ungroup([tab.id]);
        selectedTabIds.delete(tab.id);
        await loadTabs();
    } catch (error) {
        console.error("Ungroup error:", error);
    }
}

// Save group
async function saveGroup(group) {
    try {
        const groupTabs = allTabs.filter(
            (tab) => tab.groupId === group.id && tab.url
        );

        if (groupTabs.length === 0) {
            groupStatus.textContent = "This group has no tabs to save.";
            return;
        }

        const result = await browser.storage.local.get("savedGroups");
        const savedGroups = result.savedGroups || [];

        const savedGroup = {
            id: Date.now(),
            title: group.title || "Unnamed Group",
            color: group.color || "blue",
            tabs: groupTabs.map((tab) => ({
                title: tab.title || "Untitled Tab",
                url: tab.url
            }))
        };

        savedGroups.push(savedGroup);

        await browser.storage.local.set({
            savedGroups: savedGroups
        });

        groupStatus.textContent =
            `"${savedGroup.title}" saved successfully!`;

        await loadSavedGroups();

    } catch (error) {
        console.error("Save group error:", error);
        groupStatus.textContent = "Could not save group.";
    }
}

// Load saved groups
async function loadSavedGroups() {
    try {
        const result = await browser.storage.local.get("savedGroups");
        const savedGroups = result.savedGroups || [];

        displaySavedGroups(savedGroups);

    } catch (error) {
        console.error("Loading saved groups error:", error);
    }
}

// Display saved groups
function displaySavedGroups(savedGroups) {
    savedGroupsList.innerHTML = "";
    savedGroupCount.textContent = savedGroups.length;

    if (savedGroups.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "No saved groups yet.";
        savedGroupsList.appendChild(emptyMessage);
        return;
    }

    savedGroups.forEach((savedGroup) => {
        const container = document.createElement("div");
        container.className = "saved-group-item";

        const header = document.createElement("div");
        header.className = "saved-group-header";

        const colorDot = document.createElement("span");
        colorDot.className = "group-color-dot";
        colorDot.style.backgroundColor =
            groupColors[savedGroup.color] || "#7f8c8d";

        const title = document.createElement("strong");
        title.textContent = savedGroup.title;

        const count = document.createElement("span");
        count.textContent = `(${savedGroup.tabs.length} tabs)`;

        header.append(colorDot, title, count);

        const actions = document.createElement("div");
        actions.className = "saved-group-actions";

        const restoreButton = document.createElement("button");
        restoreButton.textContent = "Restore";
        restoreButton.addEventListener("click", () => {
            restoreSavedGroup(savedGroup);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-saved-button";

        deleteButton.addEventListener("click", () => {
            deleteSavedGroup(savedGroup.id);
        });

        actions.append(restoreButton, deleteButton);
        container.append(header, actions);
        savedGroupsList.appendChild(container);
    });
}

// Restore saved group
async function restoreSavedGroup(savedGroup) {
    try {
        const permission = await browser.permissions.request({
            permissions: ["tabGroups"]
        });

        if (!permission) {
            groupStatus.textContent =
                "Tab Groups permission was not granted.";
            return;
        }

        const createdTabs = await Promise.all(
            savedGroup.tabs.map((savedTab) =>
                browser.tabs.create({
                    url: savedTab.url,
                    active: false
                })
            )
        );

        const tabIds = createdTabs.map((tab) => tab.id);

        if (tabIds.length === 0) {
            groupStatus.textContent = "No tabs could be restored.";
            return;
        }

        const newGroupId = await browser.tabs.group({
            tabIds: tabIds
        });

        await browser.tabGroups.update(newGroupId, {
            title: savedGroup.title,
            color: savedGroup.color
        });

        groupStatus.textContent =
            `"${savedGroup.title}" restored successfully!`;

        await loadTabs();

    } catch (error) {
        console.error("Restore group error:", error);
        groupStatus.textContent =
            "Restore failed: " + error.message;
    }
}

// Delete saved group
async function deleteSavedGroup(groupId) {
    try {
        const result = await browser.storage.local.get("savedGroups");
        const savedGroups = result.savedGroups || [];

        const updatedGroups = savedGroups.filter(
            (group) => group.id !== groupId
        );

        await browser.storage.local.set({
            savedGroups: updatedGroups
        });

        await loadSavedGroups();

    } catch (error) {
        console.error("Delete saved group error:", error);
    }
}

// Display existing groups
function displayGroups() {
    groupsList.innerHTML = "";
    groupCount.textContent = allGroups.length;

    if (allGroups.length === 0) {
        groupsList.textContent = "No tab groups yet.";
        return;
    }

    allGroups.forEach((group) => {
        const groupContainer = document.createElement("div");
        groupContainer.className = "group-container";

        const groupHeader = document.createElement("div");
        groupHeader.className = "group-header";

        const colorDot = document.createElement("span");
        colorDot.className = "group-color-dot";
        colorDot.style.backgroundColor =
            groupColors[group.color] || "#7f8c8d";

        const groupTitle = document.createElement("strong");
        groupTitle.textContent = group.title || "Unnamed Group";

        const groupTabCount = allTabs.filter(
            (tab) => tab.groupId === group.id
        ).length;

        const count = document.createElement("span");
        count.textContent = `(${groupTabCount})`;

        groupHeader.append(colorDot, groupTitle, count);
        groupContainer.appendChild(groupHeader);

        const renameControls = document.createElement("div");
        renameControls.className = "group-controls";

        const renameInput = document.createElement("input");
        renameInput.type = "text";
        renameInput.id = `rename-input-${group.id}`;
        renameInput.placeholder = "New group name";
        renameInput.value = group.title || "";

        const renameButton = document.createElement("button");
        renameButton.textContent = "Rename";
        renameButton.addEventListener("click", () => {
            renameGroup(group);
        });

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.addEventListener("click", () => {
            saveGroup(group);
        });

        renameControls.append(renameInput, renameButton, saveButton);
        groupContainer.appendChild(renameControls);

        const colorControls = document.createElement("div");
        colorControls.className = "group-color-controls";

        const colorLabel = document.createElement("label");
        colorLabel.textContent = "Group color: ";

        const colorSelect = document.createElement("select");

        Object.keys(groupColors).forEach((color) => {
            const option = document.createElement("option");
            option.value = color;
            option.textContent =
                color.charAt(0).toUpperCase() + color.slice(1);

            if (group.color === color) {
                option.selected = true;
            }

            colorSelect.appendChild(option);
        });

        colorSelect.addEventListener("change", () => {
            changeGroupColor(group, colorSelect.value);
        });

        colorControls.append(colorLabel, colorSelect);
        groupContainer.appendChild(colorControls);

        const groupTabs = allTabs.filter(
            (tab) => tab.groupId === group.id
        );

        groupTabs.forEach((tab) => {
            const tabRow = document.createElement("div");
            tabRow.className = "group-tab-row";

            const tabTitle = document.createElement("span");
            tabTitle.textContent = tab.title || "Untitled Tab";
            tabTitle.title = tab.url || "";

            tabTitle.addEventListener("click", () => {
                browser.tabs.update(tab.id, { active: true });
            });

            const ungroupButton = document.createElement("button");
            ungroupButton.textContent = "Ungroup";
            ungroupButton.addEventListener("click", () => {
                ungroupTab(tab);
            });

            tabRow.append(tabTitle, ungroupButton);
            groupContainer.appendChild(tabRow);
        });

        groupsList.appendChild(groupContainer);
    });
}

// Load Firefox groups
async function loadGroups() {
    try {
        allGroups = await browser.tabGroups.query({});
        displayGroups();
    } catch (error) {
        console.error("Loading groups error:", error);
    }
}

// Load tabs
async function loadTabs() {
    try {
        allTabs = await browser.tabs.query({});

        const openTabIds = new Set(allTabs.map((tab) => tab.id));

        selectedTabIds.forEach((id) => {
            if (!openTabIds.has(id)) {
                selectedTabIds.delete(id);
            }
        });

        tabCount.textContent = allTabs.length;

        filterTabs();
        await loadGroups();

    } catch (error) {
        console.error("Loading tabs error:", error);
    }
}

// Create a group manually
async function createTabGroup() {
    const groupName = groupNameInput.value.trim();
    const selectedColor = groupColorInput.value;

    if (!groupName) {
        groupStatus.textContent = "Please enter a group name.";
        return;
    }

    if (selectedTabIds.size < 2) {
        groupStatus.textContent = "Select at least 2 tabs.";
        return;
    }

    const selectedTabs = allTabs.filter(
        (tab) => selectedTabIds.has(tab.id)
    );

    const windowIds = new Set(
        selectedTabs.map((tab) => tab.windowId)
    );

    if (windowIds.size > 1) {
        groupStatus.textContent =
            "Please select tabs from the same Firefox window.";
        return;
    }

    try {
        const permission = await browser.permissions.request({
            permissions: ["tabGroups"]
        });

        if (!permission) {
            groupStatus.textContent =
                "Tab Groups permission was not granted.";
            return;
        }

        const groupId = await browser.tabs.group({
            tabIds: Array.from(selectedTabIds)
        });

        await browser.tabGroups.update(groupId, {
            title: groupName,
            color: selectedColor
        });

        selectedTabIds.clear();
        groupNameInput.value = "";
        groupStatus.textContent = "Group created successfully!";

        await loadTabs();

    } catch (error) {
        console.error("Group creation error:", error);
        groupStatus.textContent = "Error: " + error.message;
    }
}

// Event listeners
searchInput.addEventListener("input", filterTabs);
createGroupButton.addEventListener("click", createTabGroup);

findSuggestionsButton.addEventListener("click", () => {
    dismissedDomains.clear();

    const suggestions = findDomainSuggestions();
    displaySuggestions(suggestions);
});

scanDuplicatesButton.addEventListener("click", scanDuplicates);

loadTabs();
loadSavedGroups();
