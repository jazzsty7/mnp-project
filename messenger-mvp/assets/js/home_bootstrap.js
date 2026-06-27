(function () {
    const friendContactsStorageKey = 'friendContacts';
    const friendRemovedNamesStorageKey = 'friendRemovedNames';
    const chatRoomsStorageKey = 'chatRooms';
    const defaultFriends = [
        { name: '영희' },
        { name: '철수' },
        { name: '민지' },
        { name: '수현' },
        { name: '지훈' },
    ];

    const loadJson = (key, fallback) => {
        try {
            const value = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
            return Array.isArray(value) ? value : fallback;
        } catch {
            return fallback;
        }
    };

    const buildFriendCount = () => {
        const customFriends = loadJson(friendContactsStorageKey, []);
        const removedNames = new Set(loadJson(friendRemovedNamesStorageKey, []));
        const seen = new Set();
        return [...customFriends, ...defaultFriends].filter((friend) => {
            if (!friend?.name || removedNames.has(friend.name) || seen.has(friend.name)) {
                return false;
            }
            seen.add(friend.name);
            return true;
        }).length;
    };

    const buildChatRoomCount = () => {
        return loadJson(chatRoomsStorageKey, []).length;
    };

    document.addEventListener('DOMContentLoaded', () => {
        const friendCountEl = document.querySelector('[data-home-friend-count]');
        const chatCountEl = document.querySelector('[data-home-chat-count]');

        if (friendCountEl) {
            friendCountEl.textContent = String(buildFriendCount());
        }

        if (chatCountEl) {
            chatCountEl.textContent = String(buildChatRoomCount());
        }

        window.addEventListener('pageshow', () => {
            if (friendCountEl) {
                friendCountEl.textContent = String(buildFriendCount());
            }
            if (chatCountEl) {
                chatCountEl.textContent = String(buildChatRoomCount());
            }
        });
    });
})();
