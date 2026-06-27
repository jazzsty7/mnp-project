document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-toast]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            alert(el.dataset.toast || 'MVP 기능입니다.');
        });
    });

    const chatCreateOverlay = document.querySelector('.chat-create-overlay');
    const chatCreateOpenButton = document.querySelector('[data-action="open-chat-create"]');
    const chatCreateCancel = document.querySelector('.chat-create-cancel');
    const chatCreateNext = document.querySelector('.chat-create-next');
    const chatCreateItems = document.querySelectorAll('.chat-create-item');
    const chatCreateSelected = document.querySelector('.chat-create-selected');
    const chatCreateSelectedList = document.querySelector('.chat-create-selected-list');
    const chatCreateTitleWrap = document.querySelector('.chat-create-title-wrap');
    const chatCreateTitleInput = document.querySelector('.chat-create-title-input');

    if (chatCreateOverlay && chatCreateOpenButton) {
        const selectedNames = new Set();

        const syncChatCreateUI = () => {
            const count = selectedNames.size;

            if (chatCreateSelected && chatCreateSelectedList) {
                chatCreateSelected.hidden = count === 0;
                chatCreateSelectedList.textContent = '';
                selectedNames.forEach((name) => {
                    const chip = document.createElement('span');
                    chip.className = 'chat-create-chip';
                    chip.textContent = name;
                    chatCreateSelectedList.appendChild(chip);
                });
            }

            if (chatCreateTitleWrap && chatCreateTitleInput) {
                chatCreateTitleWrap.hidden = count < 2;
                if (count < 2) {
                    chatCreateTitleInput.value = '';
                }
            }

            if (chatCreateNext) {
                if (count === 0) {
                    chatCreateNext.disabled = true;
                    chatCreateNext.textContent = '다음';
                } else if (count === 1) {
                    chatCreateNext.disabled = false;
                    chatCreateNext.textContent = '채팅방 열기';
                } else {
                    chatCreateNext.disabled = !chatCreateTitleInput?.value.trim();
                    chatCreateNext.textContent = '채팅방 만들기';
                }
            }

            chatCreateItems.forEach((item) => {
                const name = item.dataset.name;
                item.classList.toggle('is-selected', selectedNames.has(name));
            });
        };

        const closeChatCreate = () => {
            chatCreateOverlay.hidden = true;
            selectedNames.clear();
            syncChatCreateUI();
        };

        chatCreateOpenButton.addEventListener('click', (e) => {
            e.preventDefault();
            chatCreateOverlay.hidden = false;
            syncChatCreateUI();
        });

        if (chatCreateCancel) {
            chatCreateCancel.addEventListener('click', closeChatCreate);
        }

        chatCreateOverlay.addEventListener('click', (e) => {
            if (e.target === chatCreateOverlay) {
                closeChatCreate();
            }
        });

        chatCreateItems.forEach((item) => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                if (selectedNames.has(name)) {
                    selectedNames.delete(name);
                } else {
                    selectedNames.add(name);
                }
                syncChatCreateUI();
            });
        });

        if (chatCreateTitleInput) {
            chatCreateTitleInput.addEventListener('input', syncChatCreateUI);
        }

        if (chatCreateNext) {
            chatCreateNext.addEventListener('click', () => {
                const members = [...selectedNames];
                if (members.length === 0) {
                    return;
                }

                localStorage.setItem('pendingChatMembers', JSON.stringify(members));
                if (members.length > 1) {
                    const title = chatCreateTitleInput?.value.trim();
                    if (!title) {
                        return;
                    }
                    localStorage.setItem('pendingChatRoomTitle', title);
                } else {
                    localStorage.removeItem('pendingChatRoomTitle');
                }

                window.location.href = 'chat_room.html';
            });
        }

        syncChatCreateUI();
    }

    const chatRoomTitleEl = document.querySelector('.small-title');
    if (chatRoomTitleEl) {
        const members = JSON.parse(localStorage.getItem('pendingChatMembers') || '[]');
        const roomTitle = localStorage.getItem('pendingChatRoomTitle') || '';

        if (members.length === 1) {
            chatRoomTitleEl.textContent = members[0];
            document.title = members[0];
        } else if (members.length > 1) {
            const title = roomTitle || '그룹 채팅';
            chatRoomTitleEl.textContent = title;
            document.title = title;
        }
    }

    const chatArea = document.querySelector('.chat-area');
    const menuOverlay = document.querySelector('.message-menu-overlay');
    const menuPreview = document.querySelector('.message-menu-preview');
    const menu = document.querySelector('.message-menu');
    const replyPreview = document.querySelector('.reply-preview');
    const replyText = document.querySelector('.reply-text');
    const replyCancel = document.querySelector('.reply-cancel');
    const chatInput = document.querySelector('.chat-compose');
    const sendButton = document.querySelector('.send');
    const selectionBar = document.querySelector('.selection-bar');
    const selectionBarPrimary = document.querySelector('.selection-bar-primary');
    const selectionBarCancel = document.querySelector('.selection-bar-cancel');

    if (!chatArea || !menuOverlay || !menuPreview || !menu) {
        return;
    }

    let activeMessage = null;
    let longPressTimer = null;
    let pointerStart = null;
    let replyTarget = null;
    let selectionMode = null;
    const selectedMessages = new Set();

    const getMessageText = (messageEl) => {
        return messageEl.dataset.message || messageEl.querySelector('.bubble')?.textContent?.trim() || '';
    };

    const setMessageSelected = (messageEl, selected) => {
        messageEl.classList.toggle('is-selected', selected);
        const selectButton = messageEl.querySelector('.msg-select');
        if (selectButton) {
            selectButton.setAttribute('aria-pressed', selected ? 'true' : 'false');
        }
    };

    const updateSelectionBar = () => {
        if (!selectionBarPrimary) {
            return;
        }

        if (!selectionMode) {
            selectionBarPrimary.disabled = true;
            return;
        }

        selectionBarPrimary.textContent = selectionMode === 'delete' ? '삭제' : '저장';
        selectionBarPrimary.disabled = selectedMessages.size === 0;
    };

    const exitSelectionMode = () => {
        selectionMode = null;
        selectedMessages.forEach((messageEl) => setMessageSelected(messageEl, false));
        selectedMessages.clear();

        if (selectionBar) {
            selectionBar.hidden = true;
        }

        document.body.classList.remove('selection-mode');
        if (chatInput) {
            chatInput.placeholder = '메시지를 입력하세요';
        }

        updateSelectionBar();
    };

    const enterSelectionMode = (mode) => {
        selectionMode = mode;
        selectedMessages.clear();
        document.body.classList.add('selection-mode');
        if (selectionBar) {
            selectionBar.hidden = false;
        }
        updateSelectionBar();
    };

    const toggleMessageSelection = (messageEl) => {
        if (!selectionMode) {
            return;
        }

        if (selectedMessages.has(messageEl)) {
            selectedMessages.delete(messageEl);
            setMessageSelected(messageEl, false);
        } else {
            selectedMessages.add(messageEl);
            setMessageSelected(messageEl, true);
        }

        updateSelectionBar();
    };

    const ensureSelectionControl = (messageEl) => {
        if (messageEl.querySelector('.msg-select')) {
            return;
        }

        const selectButton = document.createElement('button');
        selectButton.type = 'button';
        selectButton.className = 'msg-select';
        selectButton.setAttribute('aria-label', '메시지 선택');
        selectButton.setAttribute('aria-pressed', 'false');
        selectButton.innerHTML = '<span>✓</span>';
        selectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMessageSelection(messageEl);
        });

        messageEl.prepend(selectButton);
    };

    const resetInteractionState = () => {
        menuOverlay.hidden = true;
        if (selectionBar) {
            selectionBar.hidden = true;
        }
        selectionMode = null;
        selectedMessages.forEach((messageEl) => setMessageSelected(messageEl, false));
        selectedMessages.clear();
        document.body.classList.remove('selection-mode');
        if (replyPreview) {
            replyPreview.hidden = true;
        }
        if (replyText) {
            replyText.textContent = '';
        }
        replyTarget = null;
        if (chatInput) {
            chatInput.placeholder = '메시지를 입력하세요';
        }
        updateSelectionBar();
    };

    const openMenu = (messageEl) => {
        activeMessage = messageEl;
        menuPreview.textContent = getMessageText(messageEl) || '선택한 대화';
        menuOverlay.hidden = false;
    };

    const closeMenu = () => {
        menuOverlay.hidden = true;
        activeMessage = null;
    };

    const setReplyTarget = (messageText) => {
        replyTarget = messageText;
        if (replyPreview && replyText) {
            replyText.textContent = messageText;
            replyPreview.hidden = false;
        }
        if (chatInput) {
            chatInput.placeholder = '답장 메시지를 입력하세요';
            chatInput.focus();
        }
    };

    const clearReplyTarget = () => {
        replyTarget = null;
        if (replyPreview) {
            replyPreview.hidden = true;
        }
        if (replyText) {
            replyText.textContent = '';
        }
        if (chatInput) {
            chatInput.placeholder = '메시지를 입력하세요';
        }
    };

    const clearTimer = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        pointerStart = null;
    };

    const startLongPress = (messageEl, clientX, clientY) => {
        if (selectionMode) {
            return;
        }

        clearTimer();
        pointerStart = { x: clientX, y: clientY };
        longPressTimer = window.setTimeout(() => {
            openMenu(messageEl);
            clearTimer();
        }, 500);
    };

    resetInteractionState();

    if (selectionBarCancel) {
        selectionBarCancel.addEventListener('click', exitSelectionMode);
    }

    if (selectionBarPrimary) {
        selectionBarPrimary.addEventListener('click', async () => {
            if (!selectionMode || selectedMessages.size === 0) {
                return;
            }

            const texts = [...selectedMessages].map((messageEl) => getMessageText(messageEl)).filter(Boolean);

            if (selectionMode === 'save') {
                const savedMessages = JSON.parse(localStorage.getItem('savedMessages') || '[]');
                texts.forEach((text) => {
                    if (!savedMessages.includes(text)) {
                        savedMessages.push(text);
                    }
                });
                localStorage.setItem('savedMessages', JSON.stringify(savedMessages));
                alert('선택한 메시지를 저장했습니다.');
                exitSelectionMode();
                return;
            }

            if (selectionMode === 'delete') {
                const savedMessages = JSON.parse(localStorage.getItem('savedMessages') || '[]');
                const remainingSavedMessages = savedMessages.filter((item) => !texts.includes(item));
                localStorage.setItem('savedMessages', JSON.stringify(remainingSavedMessages));

                selectedMessages.forEach((messageEl) => {
                    messageEl.remove();
                });
                alert('선택한 메시지를 삭제했습니다.');
                exitSelectionMode();
            }
        });
    }

    chatArea.querySelectorAll('.msg').forEach((messageEl) => {
        ensureSelectionControl(messageEl);
    });

    chatArea.querySelectorAll('.msg .bubble').forEach((bubbleEl) => {
        const messageEl = bubbleEl.closest('.msg');
        if (!messageEl) {
            return;
        }

        bubbleEl.addEventListener('pointerdown', (e) => {
            startLongPress(messageEl, e.clientX, e.clientY);
        });

        bubbleEl.addEventListener('pointermove', (e) => {
            if (!pointerStart) {
                return;
            }

            const moved = Math.abs(e.clientX - pointerStart.x) + Math.abs(e.clientY - pointerStart.y);
            if (moved > 12) {
                clearTimer();
            }
        });

        bubbleEl.addEventListener('pointerup', clearTimer);
        bubbleEl.addEventListener('pointercancel', clearTimer);
        bubbleEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!selectionMode) {
                openMenu(messageEl);
            }
        });
    });

    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) {
            closeMenu();
        }
    });

    menu.addEventListener('click', async (e) => {
        const button = e.target.closest('[data-action]');
        if (!button || !activeMessage) {
            return;
        }

        const text = getMessageText(activeMessage);
        const action = button.dataset.action;

        if (action === 'reply') {
            setReplyTarget(text);
            closeMenu();
            return;
        }

        if (action === 'copy') {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                alert('메시지를 복사했습니다.');
            } else {
                alert('이 브라우저에서는 복사를 지원하지 않습니다.');
            }
            closeMenu();
            return;
        }

        if (action === 'save') {
            closeMenu();
            enterSelectionMode('save');
            return;
        }

        if (action === 'delete') {
            closeMenu();
            enterSelectionMode('delete');
            return;
        }

        if (action === 'cancel') {
            closeMenu();
        }
    });

    if (replyCancel) {
        replyCancel.addEventListener('click', clearReplyTarget);
    }

    if (chatInput) {
        const sendMessage = () => {
            const value = chatInput.value.trim();
            if (!value) {
                return;
            }

            const sentText = replyTarget ? `답장: ${replyTarget} / ${value}` : value;
            const outgoing = document.createElement('div');
            outgoing.className = 'msg me';
            outgoing.dataset.message = sentText;
            outgoing.innerHTML = '<div class="bubble"></div>';
            outgoing.querySelector('.bubble').textContent = sentText;
            chatArea.appendChild(outgoing);
            ensureSelectionControl(outgoing);

            const bubble = outgoing.querySelector('.bubble');
            bubble.addEventListener('pointerdown', (e) => {
                startLongPress(outgoing, e.clientX, e.clientY);
            });
            bubble.addEventListener('pointermove', (e) => {
                if (!pointerStart) {
                    return;
                }
                const moved = Math.abs(e.clientX - pointerStart.x) + Math.abs(e.clientY - pointerStart.y);
                if (moved > 12) {
                    clearTimer();
                }
            });
            bubble.addEventListener('pointerup', clearTimer);
            bubble.addEventListener('pointercancel', clearTimer);
            bubble.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (!selectionMode) {
                    openMenu(outgoing);
                }
            });

            chatInput.value = '';
            clearReplyTarget();
        };

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!menuOverlay.hidden) {
                closeMenu();
                return;
            }

            if (selectionMode) {
                exitSelectionMode();
            }
        }
    });

    window.addEventListener('pageshow', () => {
        resetInteractionState();
        closeMenu();
    });
});
