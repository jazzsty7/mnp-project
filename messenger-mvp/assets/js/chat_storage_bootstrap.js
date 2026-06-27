(function () {
    const roomsStorageKey = 'chatRooms';

    const loadRooms = () => {
        try {
            const rooms = JSON.parse(localStorage.getItem(roomsStorageKey) || '[]');
            return Array.isArray(rooms) ? rooms : [];
        } catch {
            return [];
        }
    };

    const saveRooms = (rooms) => {
        localStorage.setItem(roomsStorageKey, JSON.stringify(rooms));
    };

    const buildRoomKey = (members, title) => {
        const normalizedMembers = [...members].map((item) => item.trim()).filter(Boolean).sort();
        return `${normalizedMembers.join('|')}::${(title || '').trim()}`;
    };

    const buildMessagesKey = (members, title, roomId) => {
        if (roomId) {
            return `chatMessages:${roomId}`;
        }

        const normalizedMembers = [...members].map((item) => item.trim()).filter(Boolean);
        if (normalizedMembers.length === 0) {
            return '';
        }

        return `chatMessages:${buildRoomKey(normalizedMembers, title || normalizedMembers.join(', '))}`;
    };

    const loadMessages = (storageKey) => {
        if (!storageKey) {
            return [];
        }

        try {
            const messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return Array.isArray(messages) ? messages : [];
        } catch {
            return [];
        }
    };

    const saveMessages = (storageKey, messages) => {
        if (!storageKey) {
            return;
        }

        localStorage.setItem(storageKey, JSON.stringify(messages));
    };

    const normalizeMessage = (message, fallbackRoom) => {
        if (!message) {
            return null;
        }

        if (typeof message === 'string') {
            return {
                role: 'me',
                sender: '나',
                text: message.trim(),
                createdAt: Date.now(),
                reply: null,
            };
        }

        if (typeof message !== 'object') {
            return null;
        }

        const text = typeof message.text === 'string' ? message.text.trim() : '';
        if (!text) {
            return null;
        }

        const role = message.role === 'other' ? 'other' : 'me';
        const sender = typeof message.sender === 'string' && message.sender.trim()
            ? message.sender.trim()
            : (role === 'me' ? '나' : (fallbackRoom?.members?.[0] || fallbackRoom?.title || '상대'));
        const createdAt = Number(message.createdAt || message.timestamp || Date.now());
        const reply = message.reply && typeof message.reply === 'object'
            ? {
                sender: typeof message.reply.sender === 'string' ? message.reply.sender : '',
                text: typeof message.reply.text === 'string' ? message.reply.text : '',
            }
            : null;

        return {
            role,
            sender,
            text,
            createdAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
            reply,
        };
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return new Intl.DateTimeFormat('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const formatPreview = (message) => {
        if (!message?.text) {
            return '';
        }

        const prefix = message.role === 'me' ? '' : `${message.sender ? `${message.sender}: ` : ''}`;
        const replyPrefix = message.reply?.text ? `답장: ${message.reply.text} / ` : '';
        return `${prefix}${replyPrefix}${message.text}`;
    };

    const parseRoomFromParams = () => {
        const params = new URLSearchParams(window.location.search);
        const members = (params.get('members') || '').split(',').map((item) => item.trim()).filter(Boolean);
        const titleParam = params.get('title') || '';
        const roomId = params.get('roomId') || '';
        const title = members.length === 1 ? members[0] : (titleParam || members.join(', '));
        return { members, title, roomId };
    };

    const upsertRoom = (room, lastMessage = null) => {
        const rooms = loadRooms();
        const key = room.roomId || buildRoomKey(room.members, room.title);
        const index = rooms.findIndex((item) => item.id === key);
        const nextRoom = {
            id: key,
            members: room.members,
            title: room.title,
            updatedAt: lastMessage?.createdAt || Date.now(),
            badge: 0,
            lastMessage: lastMessage || (index >= 0 ? rooms[index].lastMessage || null : null),
            lastMessageAt: lastMessage?.createdAt || (index >= 0 ? rooms[index].lastMessageAt || 0 : 0),
        };

        if (index >= 0) {
            rooms.splice(index, 1, { ...rooms[index], ...nextRoom });
        } else {
            rooms.unshift(nextRoom);
        }

        saveRooms(rooms);
        return nextRoom;
    };

    const renderRoomList = () => {
        const listEl = document.querySelector('[data-chat-room-list]');
        if (!listEl) {
            return;
        }

        listEl.textContent = '';
        const rooms = loadRooms();

        if (rooms.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'chat-room-empty';
            empty.textContent = '아직 생성된 채팅방이 없습니다.';
            listEl.appendChild(empty);
            return;
        }

        rooms.forEach((room) => {
            const storageKey = buildMessagesKey(room.members || [], room.title || '', room.id);
            const storedMessages = loadMessages(storageKey).map((item) => normalizeMessage(item, room)).filter(Boolean);
            const lastMessage = room.lastMessage || storedMessages[storedMessages.length - 1] || null;

            const link = document.createElement('a');
            link.className = 'row';
            const params = new URLSearchParams();
            params.set('members', (room.members || []).join(','));
            if (room.title) {
                params.set('title', room.title);
            }
            if (room.id) {
                params.set('roomId', room.id);
            }
            link.href = `chat_room.html?${params.toString()}`;

            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = (room.title || room.members?.[0] || '').trim().charAt(0) || '?';

            const main = document.createElement('div');
            main.className = 'row-main';

            const name = document.createElement('div');
            name.className = 'name';
            name.textContent = room.title;

            const desc = document.createElement('div');
            desc.className = 'desc';
            desc.textContent = lastMessage ? formatPreview(lastMessage) : (room.members || []).join(', ');

            main.append(name, desc);

            const meta = document.createElement('div');

            const time = document.createElement('div');
            time.className = 'time';
            time.textContent = formatTime(room.lastMessageAt || room.updatedAt);
            meta.appendChild(time);

            if (room.badge > 0) {
                const badge = document.createElement('div');
                badge.className = 'badge';
                badge.textContent = String(room.badge);
                meta.appendChild(badge);
            }

            link.append(avatar, main, meta);
            listEl.appendChild(link);
        });
    };

    const renderChatRoom = () => {
        const chatArea = document.querySelector('.chat-area');
        if (!chatArea) {
            return;
        }

        const room = parseRoomFromParams();
        const storageKey = buildMessagesKey(room.members, room.title, room.roomId);
        if (!storageKey) {
            return;
        }

        const existing = loadMessages(storageKey).map((item) => normalizeMessage(item, room)).filter(Boolean);
        chatArea.textContent = '';

        existing.forEach((message) => {
            const el = document.createElement('div');
            el.className = `msg ${message.role === 'other' ? 'other' : 'me'}`;
            el.dataset.message = message.text;
            el.dataset.sender = message.sender || (message.role === 'me' ? '나' : (room.members[0] || room.title || '상대'));
            el.dataset.createdAt = String(message.createdAt || Date.now());
            if (message.reply?.text) {
                el.dataset.replyText = message.reply.text;
                el.dataset.replySender = message.reply.sender || '';
            }

            if (message.role === 'other') {
                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                avatar.style.width = '34px';
                avatar.style.height = '34px';
                avatar.style.borderRadius = '12px';
                avatar.style.fontSize = '18px';
                avatar.textContent = (room.title || room.members[0] || '').trim().charAt(0) || '?';
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                bubble.textContent = message.text;
                el.append(avatar, bubble);
            } else {
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                bubble.textContent = message.text;
                el.appendChild(bubble);
            }

            chatArea.appendChild(el);
        });

        upsertRoom(room, existing[existing.length - 1] || null);

        const observer = new MutationObserver(() => {
            const nextMessages = [...chatArea.querySelectorAll('.msg')].map((messageEl) => normalizeMessage({
                role: messageEl.classList.contains('me') ? 'me' : 'other',
                sender: messageEl.dataset.sender || (messageEl.classList.contains('me') ? '나' : (room.members[0] || room.title || '상대')),
                text: messageEl.dataset.message || messageEl.querySelector('.bubble')?.textContent?.trim() || '',
                createdAt: Number(messageEl.dataset.createdAt || Date.now()),
                reply: messageEl.dataset.replyText ? {
                    sender: messageEl.dataset.replySender || '',
                    text: messageEl.dataset.replyText || '',
                } : null,
            }, room)).filter(Boolean);

            saveMessages(storageKey, nextMessages);
            upsertRoom(room, nextMessages[nextMessages.length - 1] || null);
        });

        observer.observe(chatArea, { childList: true, subtree: true });
    };

    document.addEventListener('DOMContentLoaded', () => {
        renderChatRoom();
        renderRoomList();
        window.addEventListener('pageshow', () => {
            renderChatRoom();
            renderRoomList();
        });
    });
})();
