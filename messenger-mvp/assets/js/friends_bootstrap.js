(function () {
    const friendContactsStorageKey = 'friendContacts';
    const friendRemovedNamesStorageKey = 'friendRemovedNames';
    const defaultFriends = [
        { name: '영희', desc: '오늘도 열심히 지내는 중', avatar: '영' },
        { name: '철수', desc: '사진을 좋아하는 친구', avatar: '철' },
        { name: '민지', desc: '늘 새로운 걸 찾는 중', avatar: '민' },
        { name: '수현', desc: '확인했어요', avatar: '수' },
        { name: '지훈', desc: '프로젝트 준비 중', avatar: '지' },
    ];

    const loadFriendContacts = () => {
        try {
            const friends = JSON.parse(localStorage.getItem(friendContactsStorageKey) || '[]');
            return Array.isArray(friends) ? friends : [];
        } catch {
            return [];
        }
    };

    const saveFriendContacts = (friends) => {
        localStorage.setItem(friendContactsStorageKey, JSON.stringify(friends));
    };

    const loadRemovedFriendNames = () => {
        try {
            const names = JSON.parse(localStorage.getItem(friendRemovedNamesStorageKey) || '[]');
            return Array.isArray(names) ? names.filter(Boolean) : [];
        } catch {
            return [];
        }
    };

    const saveRemovedFriendNames = (names) => {
        localStorage.setItem(friendRemovedNamesStorageKey, JSON.stringify(names));
    };

    const normalizeFriendName = (value) => value.trim().replace(/\s+/g, ' ');

    const buildFriendContacts = () => {
        const customFriends = loadFriendContacts();
        const removedNames = new Set(loadRemovedFriendNames());
        const merged = [...customFriends, ...defaultFriends];
        const seen = new Set();

        return merged.filter((friend) => {
            if (!friend?.name || seen.has(friend.name) || removedNames.has(friend.name)) {
                return false;
            }
            seen.add(friend.name);
            return true;
        });
    };

    const buildFriendAvatar = (name) => (name?.trim() || '?').charAt(0);

    const resolveFriendAvatarInput = (value, fallbackName) => {
        const raw = normalizeFriendName(value || '');
        if (!raw) {
            return { avatar: buildFriendAvatar(fallbackName), avatarImage: '' };
        }

        const looksLikeImageUrl = /^(https?:\/\/|data:|\/)/i.test(raw) || /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(raw);
        if (looksLikeImageUrl) {
            return { avatar: '', avatarImage: raw };
        }

        return { avatar: raw.charAt(0), avatarImage: '', avatarText: raw };
    };

    const buildFriendRecord = ({ name, desc, avatar, avatarImage, avatarText, status }) => ({
        name,
        desc: desc || status || '새로 추가된 친구',
        avatar: avatarText || avatar || buildFriendAvatar(name),
        avatarImage: avatarImage || '',
        status: status || desc || '',
    });

    document.addEventListener('DOMContentLoaded', () => {
        const friendListEl = document.querySelector('[data-friend-list]');
        if (!friendListEl) {
            return;
        }

        const friendSearchInput = document.querySelector('.friend-search');
        const friendAddOverlay = document.querySelector('.friend-add-overlay');
        const friendAddTitleEl = document.querySelector('.friend-add-title');
        const friendAddSubtitleEl = document.querySelector('.friend-add-subtitle');
        const friendAddSubmit = document.querySelector('.friend-add-submit');
        const friendAddOpenButton = document.querySelector('[data-action="open-friend-add"]');
        const friendAddCancel = document.querySelector('.friend-add-cancel');
        const friendAddNameInput = document.querySelector('.friend-add-name-input');
        const friendAddAvatarInput = document.querySelector('.friend-add-avatar-input');
        const friendAddStatusInput = document.querySelector('.friend-add-status-input');
        const friendAddDescInput = document.querySelector('.friend-add-desc-input');
        const friendMenuOverlay = document.querySelector('.friend-menu-overlay');
        const friendMenuNameEl = document.querySelector('.friend-menu-name');
        const friendMenuEdit = document.querySelector('.friend-menu-edit');
        const friendMenuDelete = document.querySelector('.friend-menu-delete');
        const friendMenuClose = document.querySelector('.friend-menu-close');
        let friendEditTarget = null;
        let activeFriendName = '';
        let pressTimer = null;
        let pressTriggered = false;

        const closeFriendAdd = () => {
            if (!friendAddOverlay) {
                return;
            }

            friendAddOverlay.hidden = true;
            friendEditTarget = null;
            if (friendAddTitleEl) {
                friendAddTitleEl.textContent = '친구 추가';
            }
            if (friendAddSubtitleEl) {
                friendAddSubtitleEl.textContent = '새 친구의 이름을 입력하면 목록에 바로 추가됩니다.';
            }
            if (friendAddSubmit) {
                friendAddSubmit.textContent = '추가';
            }
        };

        const openFriendAdd = (friend = null) => {
            if (!friendAddOverlay) {
                return;
            }

            friendEditTarget = friend?.name || null;
            friendAddOverlay.hidden = false;
            if (friendAddTitleEl) {
                friendAddTitleEl.textContent = friendEditTarget ? '친구 정보 변경' : '친구 추가';
            }
            if (friendAddSubtitleEl) {
                friendAddSubtitleEl.textContent = friendEditTarget ? '친구 정보를 수정한 뒤 변경하세요.' : '새 친구의 이름을 입력하면 목록에 바로 추가됩니다.';
            }
            if (friendAddSubmit) {
                friendAddSubmit.textContent = friendEditTarget ? '변경' : '추가';
            }
            [friendAddNameInput, friendAddAvatarInput, friendAddStatusInput, friendAddDescInput].forEach((input) => {
                if (input) {
                    input.value = '';
                }
            });
            if (friend) {
                if (friendAddNameInput) friendAddNameInput.value = friend.name || '';
                if (friendAddAvatarInput) friendAddAvatarInput.value = friend.avatarImage || friend.avatar || '';
                if (friendAddStatusInput) friendAddStatusInput.value = friend.status || friend.desc || '';
                if (friendAddDescInput) friendAddDescInput.value = friend.desc || friend.status || '';
            }
            window.setTimeout(() => friendAddNameInput?.focus(), 0);
        };

        const closeFriendMenu = () => {
            if (friendMenuOverlay) {
                friendMenuOverlay.hidden = true;
            }
            activeFriendName = '';
        };

        const openFriendMenu = (friend) => {
            if (!friendMenuOverlay || !friend) {
                return;
            }

            activeFriendName = friend.name;
            if (friendMenuNameEl) {
                friendMenuNameEl.textContent = friend.name;
            }
            friendMenuOverlay.hidden = false;
        };

        const renderFriendList = () => {
            const query = (friendSearchInput?.value || '').trim().toLowerCase();
            const friends = buildFriendContacts();
            friendListEl.textContent = '';

            if (friends.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'chat-room-empty';
                emptyState.textContent = '아직 추가된 친구가 없습니다.';
                friendListEl.appendChild(emptyState);
                return;
            }

            friends.forEach((friend) => {
                const haystack = [friend.name, friend.status, friend.desc].filter(Boolean).join(' ').toLowerCase();
                if (query && !haystack.includes(query)) {
                    return;
                }

                const wrap = document.createElement('div');
                wrap.className = 'friend-row-wrap';

                const link = document.createElement('a');
                link.className = 'row friend-row-link';
                link.href = `friend_profile.html?name=${encodeURIComponent(friend.name)}`;

                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                if (friend.avatarImage) {
                    avatar.classList.add('has-image');
                    avatar.style.backgroundImage = `url(${friend.avatarImage})`;
                    avatar.textContent = '';
                } else {
                    avatar.textContent = friend.avatar || buildFriendAvatar(friend.name);
                }

                const main = document.createElement('div');
                main.className = 'row-main';

                const name = document.createElement('div');
                name.className = 'name';
                name.textContent = friend.name;

                const desc = document.createElement('div');
                desc.className = 'desc';
                desc.textContent = friend.status || friend.desc || '친구';

                main.append(name, desc);
                link.append(avatar, main);
                wrap.appendChild(link);
                friendListEl.appendChild(wrap);

                let longPressTimer = null;
                const clearTimer = () => {
                    if (longPressTimer) {
                        window.clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }
                };

                link.addEventListener('pointerdown', (e) => {
                    if (e.pointerType === 'mouse' && e.button !== 0) {
                        return;
                    }
                    clearTimer();
                    pressTriggered = false;
                    longPressTimer = window.setTimeout(() => {
                        pressTriggered = true;
                        openFriendMenu(friend);
                    }, 500);
                }, true);

                link.addEventListener('pointerup', clearTimer, true);
                link.addEventListener('pointercancel', clearTimer, true);
                link.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    openFriendMenu(friend);
                });
                link.addEventListener('click', (e) => {
                    if (pressTriggered) {
                        e.preventDefault();
                        pressTriggered = false;
                    }
                });
            });
        };

        const saveFriend = () => {
            const name = normalizeFriendName(friendAddNameInput?.value || '');
            const avatarInput = friendAddAvatarInput?.value || '';
            const status = normalizeFriendName(friendAddStatusInput?.value || '');
            const desc = normalizeFriendName(friendAddDescInput?.value || '');

            if (!name) {
                alert('친구 이름을 입력하세요.');
                return;
            }

            const visibleFriends = buildFriendContacts();
            if (!friendEditTarget && visibleFriends.some((friend) => friend.name === name)) {
                alert('이미 등록된 친구입니다.');
                return;
            }

            const resolvedAvatar = resolveFriendAvatarInput(avatarInput, name);
            const friends = loadFriendContacts().filter((item) => item.name !== (friendEditTarget || name));
            friends.unshift(buildFriendRecord({
                name,
                desc: desc || status || '새로 추가된 친구',
                status,
                ...resolvedAvatar,
            }));
            saveFriendContacts(friends);

            const removedNames = loadRemovedFriendNames().filter((item) => item !== name);
            saveRemovedFriendNames(removedNames);

            renderFriendList();
            closeFriendAdd();
        };

        if (friendSearchInput) {
            friendSearchInput.addEventListener('input', renderFriendList);
        }

        if (friendAddOpenButton) {
            friendAddOpenButton.addEventListener('click', (e) => {
                e.preventDefault();
                openFriendAdd();
            });
        }

        if (friendAddCancel) {
            friendAddCancel.addEventListener('click', closeFriendAdd);
        }

        if (friendAddSubmit) {
            friendAddSubmit.addEventListener('click', saveFriend);
        }

        [friendAddNameInput, friendAddAvatarInput, friendAddStatusInput, friendAddDescInput].forEach((input) => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveFriend();
                    }
                });
            }
        });

        if (friendAddOverlay) {
            friendAddOverlay.addEventListener('click', (e) => {
                if (e.target === friendAddOverlay) {
                    closeFriendAdd();
                }
            });
        }

        if (friendMenuEdit) {
            friendMenuEdit.addEventListener('click', () => {
                if (!activeFriendName) {
                    return;
                }
                const friend = buildFriendContacts().find((item) => item.name === activeFriendName);
                closeFriendMenu();
                if (friend) {
                    openFriendAdd(friend);
                }
            });
        }

        if (friendMenuDelete) {
            friendMenuDelete.addEventListener('click', () => {
                if (!activeFriendName) {
                    return;
                }
                if (window.confirm(`'${activeFriendName}' 친구를 삭제할까요?`)) {
                    const remaining = loadFriendContacts().filter((item) => item.name !== activeFriendName);
                    saveFriendContacts(remaining);
                    const removedNames = new Set(loadRemovedFriendNames());
                    removedNames.add(activeFriendName);
                    saveRemovedFriendNames([...removedNames]);
                    renderFriendList();
                }
                closeFriendMenu();
            });
        }

        if (friendMenuClose) {
            friendMenuClose.addEventListener('click', closeFriendMenu);
        }

        if (friendMenuOverlay) {
            friendMenuOverlay.addEventListener('click', (e) => {
                if (e.target === friendMenuOverlay) {
                    closeFriendMenu();
                }
            });
        }

        renderFriendList();

        window.addEventListener('pageshow', renderFriendList);
    });
})();
