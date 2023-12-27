'use strict';

if (location.href.substr(0, 5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4);

/**
 * Elit Live SFU - Room component
 *
 * @link    GitHub: https://github.com/miroslavpejic85/mirotalksfu
 * @link    Official Live demo: https://sfu.mirotalk.com
 * @license For open source use: AGPLv3
 * @license For commercial or closed source, contact us at license.mirotalk@gmail.com or purchase directly via CodeCanyon
 * @license CodeCanyon: https://codecanyon.net/item/mirotalk-sfu-webrtc-realtime-video-conferences/40769970
 * @author  Miroslav Pejic - miroslav.pejic.85@gmail.com
 * @version 1.2.8
 *
 */

// ####################################################
// STATIC SETTINGS
// ####################################################

console.log('Window Location', window.location);

const socket = io({ transports: ['websocket'] });

let survey = {
    enabled: true,
    url: 'https://www.questionpro.com/t/AUs7VZq02P',
};

let redirect = {
    enabled: true,
    url: '/newroom',
};

const _PEER = {
    audioOn: '<i class="fas fa-microphone"></i>',
    audioOff: '<i style="color: red;" class="fas fa-microphone-slash"></i>',
    videoOn: '<i class="fas fa-video"></i>',
    videoOff: '<i style="color: red;" class="fas fa-video-slash"></i>',
    screenOn: '<i class="fas fa-desktop"></i>',
    screenOff: '<i style="color: red;" class="fas fa-desktop"></i>',
    raiseHand: '<i style="color: rgb(0, 255, 71);" class="fas fa-hand-paper pulsate"></i>',
    lowerHand: '',
    acceptPeer: '<i class="fas fa-check"></i>',
    ejectPeer: '<i class="fas fa-times"></i>',
    sendFile: '<i class="fas fa-upload"></i>',
    sendMsg: '<i class="fas fa-paper-plane"></i>',
    sendVideo: '<i class="fab fa-youtube"></i>',
};

const bars = document.querySelectorAll('.volume-bar');

const userAgent = navigator.userAgent.toLowerCase();
const isTabletDevice = isTablet(userAgent);
const isIPadDevice = isIpad(userAgent);

const Base64Prefix = 'data:application/pdf;base64,';

const wbImageInput = 'image/*';
const wbPdfInput = 'application/pdf';
const wbWidth = window.innerWidth;
const wbHeight = window.innerHeight;

const swalImageUrl = '../images/pricing-illustration.svg';

// Get Settings from localStorage
const lS = new LocalStorage();
const localStorageSettings = lS.getObjectLocalStorage('SFU_SETTINGS');
const lsSettings = localStorageSettings ? localStorageSettings : lS.SFU_SETTINGS;
console.log('LS_SETTINGS', lsSettings);

// ####################################################
// DYNAMIC SETTINGS
// ####################################################

let swalBackground = 'radial-gradient(#393939, #000000)'; //'rgba(0, 0, 0, 0.7)';

let rc = null;
let producer = null;
let participantsCount = 0;
let lobbyParticipantsCount = 0;
let chatMessagesId = 0;

let room_id = getRoomId();
let room_password = getRoomPassword();
let peer_name = getPeerName();
let peer_uuid = getPeerUUID();
let peer_username = getPeerUsername();
let peer_password = getPeerPassword();
let isScreenAllowed = getScreen();
let isHideMeActive = getHideMeActive();
let notify = getNotify();
isPresenter = isPeerPresenter();

let peer_info = null;

let isPushToTalkActive = false;
let isSpaceDown = false;
let isPitchBarEnabled = true;
let isSoundEnabled = true;
let isLobbyEnabled = false;
let isLobbyOpen = false;
let hostOnlyRecording = false;
let isEnumerateAudioDevices = false;
let isEnumerateVideoDevices = false;
let isAudioAllowed = false;
let isVideoAllowed = false;
let isVideoPrivacyActive = false;
let isRecording = false;
let isAudioVideoAllowed = false;
let isParticipantsListOpen = false;
let isVideoControlsOn = false;
let isChatPasteTxt = false;
let isChatMarkdownOn = false;
let isChatGPTOn = false;
let isSpeechSynthesisSupported = 'speechSynthesis' in window;
let joinRoomWithoutAudioVideo = true;
let joinRoomWithScreen = false;
let initAudioButton = null;
let initVideoButton = null;
let initAudioVideoButton = null;

let recTimer = null;
let recElapsedTime = null;

let wbCanvas = null;
let wbIsLock = false;
let wbIsDrawing = false;
let wbIsOpen = false;
let wbIsRedoing = false;
let wbIsEraser = false;
let wbIsBgTransparent = false;
let wbPop = [];
let coords = {};

let isButtonsVisible = false;
let isButtonsBarOver = false;

let isRoomLocked = false;

let initStream = null;

let scriptProcessor = null;

const RoomURL = window.location.origin + '/join/' + room_id;

let transcription;

// ####################################################
// INIT ROOM
// ####################################################

function initClient() {
    setTheme();
    if (!DetectRTC.isMobileDevice) {
        refreshMainButtonsToolTipPlacement();
        setTippy('closeEmojiPickerContainer', 'Kapat', 'bottom');
        setTippy('mySettingsCloseBtn', 'Kapat', 'bottom');
        setTippy(
            'switchPushToTalk',
            'Etkinse, Boşluk çubuğuna basıldığında mikrofon açılacak, tuş bırakıldığında duracak, adeta bir telsiz gibi.',
            'right',
        );
        setTippy('lobbyAcceptAllBtn', 'Kabul Et', 'top');
        setTippy('lobbyRejectAllBtn', 'Reddet', 'top');
        setTippy(
            'switchLobby',
            'Lobi modu, toplantınızı bir moderatör tarafından resmi bir onaydan sonra girişe izin vererek korumanıza olanak tanır.',
            'right',
        );
        setTippy('switchPitchBar', 'Ses tonu çubuğunu aç/kapat', 'right');
        setTippy('switchSounds', 'Bildirim seslerini aç/kapat', 'right');
        setTippy('switchShare', "'Odayı Paylaş' penceresini katılma sırasında göster", 'right');
        setTippy('roomId', 'Oda adı (kopyalamak için tıklayın)', 'right');
        setTippy('sessionTime', 'Oturum süresi', 'right');
        setTippy('recImage', 'Kaydı Aç/Kapat', 'right');
        setTippy('roomRecording', 'Sadece ev sahibi (sunucu) toplantıyı kaydetme yeteneğine sahiptir', 'bottom');
        setTippy('whiteboardGhostButton', 'Saydam arka planı aç/kapat', 'bottom');
        setTippy('wbBackgroundColorEl', 'Arka plan rengi', 'bottom');
        setTippy('wbDrawingColorEl', 'Çizim rengi', 'bottom');
        setTippy('whiteboardPencilBtn', 'Çizim modu', 'bottom');
        setTippy('whiteboardObjectBtn', 'Nesne modu', 'bottom');
        setTippy('whiteboardUndoBtn', 'Geri Al', 'bottom');
        setTippy('whiteboardRedoBtn', 'Yinele', 'bottom');
        setTippy('whiteboardImgFileBtn', 'Resim dosyası ekle', 'bottom');
        setTippy('whiteboardPdfFileBtn', 'PDF dosyası ekle', 'bottom');
        setTippy('whiteboardImgUrlBtn', 'Resim URL ekle', 'bottom');
        setTippy('whiteboardTextBtn', 'Metin ekle', 'bottom');
        setTippy('whiteboardLineBtn', 'Çizgi ekle', 'bottom');
        setTippy('whiteboardRectBtn', 'Dikdörtgen ekle', 'bottom');
        setTippy('whiteboardTriangleBtn', 'Üçgen ekle', 'bottom');
        setTippy('whiteboardCircleBtn', 'Daire ekle', 'bottom');
        setTippy('whiteboardSaveBtn', 'Kaydet', 'bottom');
        setTippy('whiteboardEraserBtn', 'Silgi', 'bottom');
        setTippy('whiteboardCleanBtn', 'Temizle', 'bottom');
        setTippy('whiteboardLockButton', 'Etkinse, katılımcılar etkileşimde bulunamaz', 'right');
        setTippy('whiteboardCloseBtn', 'Kapat', 'right');
        setTippy('chatCleanTextButton', 'Temizle', 'top');
        setTippy('chatPasteButton', 'Yapıştır', 'top');
        setTippy('chatSendButton', 'Gönder', 'top');
        setTippy('showChatOnMsg', 'Yeni mesaj geldiğinde sohbeti göster', 'bottom');
        setTippy('speechIncomingMsg', 'Gelen mesajları seslendir', 'bottom');
        setTippy('chatSpeechStartButton', 'Konuşma tanıma başlat', 'top');
        setTippy('chatSpeechStopButton', 'Konuşma tanımayı durdur', 'top');
        setTippy('chatEmojiButton', 'Emoji', 'top');
        setTippy('chatMarkdownButton', 'Markdown', 'top');
        setTippy('chatCloseButton', 'Kapat', 'bottom');
        setTippy('chatTogglePin', 'Sabitlemeyi aç/kapat', 'bottom');
        setTippy('chatHideParticipantsList', 'Gizle', 'bottom');
        setTippy('chatShowParticipantsList', 'Katılımcı listesini aç/kapat', 'bottom');
        setTippy('chatMaxButton', 'Büyüt', 'bottom');
        setTippy('chatMinButton', 'Küçült', 'bottom');
        setTippy('participantsSaveBtn', 'Katılımcı bilgilerini kaydet', 'bottom');
        setTippy('participantsUnreadMessagesBtn', 'Okunmamış mesajları aç/kapat', 'bottom');
        setTippy('transcriptionCloseBtn', 'Kapat', 'bottom');
        setTippy('transcriptionTogglePinBtn', 'Sabitlemeyi aç/kapat', 'bottom');
        setTippy('transcriptionMaxBtn', 'Büyüt', 'bottom');
        setTippy('transcriptionMinBtn', 'Küçült', 'bottom');
        setTippy('transcriptionSpeechStatus', 'Durum', 'bottom');
        setTippy('transcriptShowOnMsg', 'Yeni mesaj geldiğinde transkripti göster', 'bottom');
        setTippy('transcriptionGhostBtn', 'Saydam arka planı aç/kapat', 'bottom');
        setTippy('transcriptionSaveBtn', 'Kaydet', 'bottom');
        setTippy('transcriptionCleanBtn', 'Temizle', 'bottom');
        setTippy('transcriptionSpeechStart', 'Transkripsiyonu başlat', 'top');
        setTippy('transcriptionSpeechStop', 'Transkripsiyonu durdur', 'top');

    }
    setupWhiteboard();
    initEnumerateDevices();

    // Transcription
    transcription = new Transcription();
    transcription.init();
}

// ####################################################
// HANDLE MAIN BUTTONS TOOLTIP
// ####################################################

function refreshMainButtonsToolTipPlacement() {
    if (!DetectRTC.isMobileDevice) {
        const placement = BtnsBarPosition.options[BtnsBarPosition.selectedIndex].value == 'vertical' ? 'right' : 'top';

        setTippy('shareButton', 'Odayı paylaş', placement);
        setTippy('hideMeButton', 'Gizlemeyi aç/kapat', placement);
        setTippy('startAudioButton', 'Ses aç', placement);
        setTippy('stopAudioButton', 'Ses kapat', placement);
        setTippy('startVideoButton', 'Kamera aç', placement);
        setTippy('stopVideoButton', 'Kamera kapat', placement);
        setTippy('startScreenButton', 'Ekran paylaşımı başlat', placement);
        setTippy('stopScreenButton', 'Ekran paylaşımı durdur', placement);
        setTippy('startRecButton', 'Kayıt başlat', placement);
        setTippy('stopRecButton', 'Kayıt durdur', placement);
        setTippy('raiseHandButton', 'El kaldır', placement);
        setTippy('lowerHandButton', 'El indir', placement);
        setTippy('roomEmojiPicker', 'Emoji tepkisini değiştir', placement);
        setTippy('swapCameraButton', 'Kamera değiştir', placement);
        setTippy('chatButton', 'Sohbet aç/kapat', placement);
        setTippy('transcriptionButton', 'Çevri aç/kapat', placement);
        setTippy('whiteboardButton', 'Beyaz tahta', placement);
        setTippy('settingsButton', 'Ayarlar', placement);
        setTippy('aboutButton', 'Bu proje hakkında', placement);
        setTippy('exitButton', 'Ayrıl', placement);

    }
}

// ####################################################
// HANDLE TOOLTIP
// ####################################################

function setTippy(elem, content, placement, allowHTML = false) {
    const element = document.getElementById(elem);
    if (element) {
        if (element._tippy) {
            element._tippy.destroy();
        }
        tippy(element, {
            content: content,
            placement: placement,
            allowHTML: allowHTML,
        });
    } else {
        console.warn('setTippy element not found with content', content);
    }
}

// ####################################################
// GET ROOM ID
// ####################################################

function getRoomId() {
    let qs = new URLSearchParams(window.location.search);
    let queryRoomId = filterXSS(qs.get('room'));
    let roomId = queryRoomId ? queryRoomId : location.pathname.substring(6);
    if (roomId == '') {
        roomId = makeId(12);
    }
    console.log('Direct join', { room: roomId });
    window.localStorage.lastRoom = roomId;
    return roomId;
}

function makeId(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// ####################################################
// ENUMERATE DEVICES
// ####################################################

async function initEnumerateDevices() {
    console.log('01 ----> init Enumerate Devices');
    await initEnumerateVideoDevices();
    await initEnumerateAudioDevices();
    if (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {
        BUTTONS.main.startScreenButton && show(initStartScreenButton);
    }
    if (!isAudioAllowed && !isVideoAllowed && !joinRoomWithoutAudioVideo) {
        openURL(`/permission?room_id=${room_id}&message=Not allowed both Audio and Video`);
    } else {
        whoAreYou();
        setButtonsInit();
        setSelectsInit();
        handleSelectsInit();
    }
}

async function initEnumerateVideoDevices() {
    if (isEnumerateVideoDevices) return;
    // allow the video
    await navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
            enumerateVideoDevices(stream);
            isVideoAllowed = true;
        })
        .catch(() => {
            isVideoAllowed = false;
        });
}

function enumerateVideoDevices(stream) {
    console.log('03 ----> Get Video Devices');
    navigator.mediaDevices
        .enumerateDevices()
        .then((devices) =>
            devices.forEach((device) => {
                let el = null;
                let eli = null;
                if ('videoinput' === device.kind) {
                    el = videoSelect;
                    eli = initVideoSelect;
                    lS.DEVICES_COUNT.video++;
                }
                if (!el) return;
                addChild(device, [el, eli]);
            }),
        )
        .then(() => {
            stopTracks(stream);
            isEnumerateVideoDevices = true;
        });
}

async function initEnumerateAudioDevices() {
    if (isEnumerateAudioDevices) return;
    // allow the audio
    await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
            enumerateAudioDevices(stream);
            getMicrophoneVolumeIndicator(stream);
            isAudioAllowed = true;
        })
        .catch(() => {
            isAudioAllowed = false;
        });
}

function enumerateAudioDevices(stream) {
    console.log('02 ----> Get Audio Devices');
    navigator.mediaDevices
        .enumerateDevices()
        .then((devices) =>
            devices.forEach((device) => {
                let el = null;
                let eli = null;
                if ('audioinput' === device.kind) {
                    el = microphoneSelect;
                    eli = initMicrophoneSelect;
                    lS.DEVICES_COUNT.audio++;
                } else if ('audiooutput' === device.kind) {
                    el = speakerSelect;
                    eli = initSpeakerSelect;
                    lS.DEVICES_COUNT.speaker++;
                }
                if (!el) return;
                addChild(device, [el, eli]);
            }),
        )
        .then(() => {
            stopTracks(stream);
            isEnumerateAudioDevices = true;
            const sinkId = 'sinkId' in HTMLMediaElement.prototype;
            speakerSelect.disabled = !sinkId;
            // Check if there is speakers
            if (!sinkId || initSpeakerSelect.options.length === 0) {
                hide(initSpeakerSelect);
                hide(speakerSelectDiv);
            }
        });
}

function stopTracks(stream) {
    stream.getTracks().forEach((track) => {
        track.stop();
    });
}

function addChild(device, els) {
    let kind = device.kind;
    els.forEach((el) => {
        let option = document.createElement('option');
        option.value = device.deviceId;
        switch (kind) {
            case 'videoinput':
                option.innerText = `📹 ` + device.label || `📹 camera ${el.length + 1}`;
                break;
            case 'audioinput':
                option.innerText = `🎤 ` + device.label || `🎤 microphone ${el.length + 1}`;
                break;
            case 'audiooutput':
                option.innerText = `🔈 ` + device.label || `🔈 speaker ${el.length + 1}`;
                break;
            default:
                break;
        }
        el.appendChild(option);
    });
}

// ####################################################
// MICROPHONE VOLUME INDICATOR
// ####################################################

function getMicrophoneVolumeIndicator(stream) {
    if (isAudioContextSupported() && hasAudioTrack(stream)) {
        stopMicrophoneProcessing();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const microphone = audioContext.createMediaStreamSource(stream);
        scriptProcessor = audioContext.createScriptProcessor(1024, 1, 1);
        scriptProcessor.onaudioprocess = function (event) {
            const inputBuffer = event.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < inputBuffer.length; i++) {
                sum += inputBuffer[i] * inputBuffer[i];
            }
            const rms = Math.sqrt(sum / inputBuffer.length);
            const volume = Math.max(0, Math.min(1, rms * 10));
            updateVolumeIndicator(volume);
        };
        microphone.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
    }
}

function stopMicrophoneProcessing() {
    if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor = null;
    }
    bars.forEach((bar) => {
        bar.classList.toggle('inactive');
    });
}

function updateVolumeIndicator(volume) {
    const activeBars = Math.ceil(volume * bars.length);
    bars.forEach((bar, index) => {
        bar.classList.toggle('active', index < activeBars);
    });
}

function isAudioContextSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
}

function hasAudioTrack(mediaStream) {
    const audioTracks = mediaStream.getAudioTracks();
    return audioTracks.length > 0;
}

function hasVideoTrack(mediaStream) {
    const videoTracks = mediaStream.getVideoTracks();
    return videoTracks.length > 0;
}

// ####################################################
// API CHECK
// ####################################################

function getScreen() {
    let qs = new URLSearchParams(window.location.search);
    let screen = filterXSS(qs.get('screen'));
    if (screen) {
        screen = screen.toLowerCase();
        let queryScreen = screen === '1' || screen === 'true';
        if (queryScreen != null && (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia)) {
            console.log('Direct join', { screen: queryScreen });
            return queryScreen;
        }
    }
    console.log('Direct join', { screen: false });
    return false;
}

function getNotify() {
    let qs = new URLSearchParams(window.location.search);
    let notify = filterXSS(qs.get('notify'));
    if (notify) {
        notify = notify.toLowerCase();
        let queryNotify = notify === '1' || notify === 'true';
        if (queryNotify != null) {
            console.log('Direct join', { notify: queryNotify });
            return queryNotify;
        }
    }
    notify = lsSettings.share_on_join;
    console.log('Direct join', { notify: notify });
    return notify;
}

function getHideMeActive() {
    let qs = new URLSearchParams(window.location.search);
    let hide = filterXSS(qs.get('hide'));
    let queryHideMe = false;
    if (hide) {
        hide = hide.toLowerCase();
        queryHideMe = hide === '1' || hide === 'true';
    }
    console.log('Direct join', { hide: queryHideMe });
    return queryHideMe;
}

function isPeerPresenter() {
    let qs = new URLSearchParams(window.location.search);
    let presenter = filterXSS(qs.get('isPresenter'));
    if (presenter) {
        presenter = presenter.toLowerCase();
        let queryPresenter = presenter === '1' || presenter === 'true';
        if (queryPresenter != null) {
            console.log('Direct join Reconnect', { isPresenter: queryPresenter });
            return queryPresenter;
        }
    }
    console.log('Direct join Reconnect', { presenter: false });
    return false;
}

function getPeerName() {
    const qs = new URLSearchParams(window.location.search);
    const name = filterXSS(qs.get('name'));
    if (isHtml(name)) {
        console.log('Direct join', { name: 'Invalid name' });
        return 'Invalid name';
    }
    console.log('Direct join', { name: name });
    return name;
}

function getPeerUUID() {
    if (lS.getItemLocalStorage('peer_uuid')) {
        return lS.getItemLocalStorage('peer_uuid');
    }
    const peer_uuid = getUUID();
    lS.setItemLocalStorage('peer_uuid', peer_uuid);
    return peer_uuid;
}

function getPeerUsername() {
    if (window.sessionStorage.peer_username) return window.sessionStorage.peer_username;
    let qs = new URLSearchParams(window.location.search);
    let username = filterXSS(qs.get('username'));
    let queryUsername = false;
    if (username) {
        queryUsername = username;
    }
    console.log('Direct join', { username: queryUsername });
    return queryUsername;
}

function getPeerPassword() {
    if (window.sessionStorage.peer_password) return window.sessionStorage.peer_password;
    let qs = new URLSearchParams(window.location.search);
    let password = filterXSS(qs.get('password'));
    let queryPassword = false;
    if (password) {
        queryPassword = password;
    }
    console.log('Direct join', { password: queryPassword });
    return queryPassword;
}

function getRoomPassword() {
    let qs = new URLSearchParams(window.location.search);
    let roomPassword = filterXSS(qs.get('roomPassword'));
    if (roomPassword) {
        let queryNoRoomPassword = roomPassword === '0' || roomPassword === 'false';
        if (queryNoRoomPassword) {
            roomPassword = false;
        }
        console.log('Direct join', { password: roomPassword });
        return roomPassword;
    }
    return false;
}

// ####################################################
// INIT CONFIG
// ####################################################

function checkInitConfig() {
    const initConfig = lS.getInitConfig();
    console.log('04.5 ----> Get init config', initConfig);
    if (initConfig) {
        if (isAudioVideoAllowed && !initConfig.audioVideo) {
            handleAudioVideo();
        } else {
            if (isAudioAllowed && !initConfig.audio) handleAudio();
            if (isVideoAllowed && !initConfig.video) handleVideo();
        }
    }
}

// ####################################################
// SOME PEER INFO
// ####################################################

function getPeerInfo() {
    peer_info = {
        join_data_time: getDataTimeString(),
        peer_uuid: peer_uuid,
        peer_id: socket.id,
        peer_name: peer_name,
        peer_username: peer_username,
        peer_password: peer_password,
        peer_presenter: isPresenter,
        peer_audio: isAudioAllowed,
        peer_video: isVideoAllowed,
        peer_screen: isScreenAllowed,
        peer_recording: isRecording,
        peer_video_privacy: isVideoPrivacyActive,
        peer_hand: false,
        is_desktop_device: !DetectRTC.isMobileDevice && !isTabletDevice && !isIPadDevice,
        is_mobile_device: DetectRTC.isMobileDevice,
        is_tablet_device: isTabletDevice,
        is_ipad_pro_device: isIPadDevice,
        os_name: DetectRTC.osName,
        os_version: DetectRTC.osVersion,
        browser_name: DetectRTC.browser.name,
        browser_version: DetectRTC.browser.version,
        user_agent: userAgent,
    };
}

// ####################################################
// ENTER YOUR NAME | Enable/Disable AUDIO/VIDEO
// ####################################################

function whoAreYou() {
    console.log('04 ----> Who are you');

    hide(loadingDiv);
    document.body.style.background = 'var(--body-bg)';

    if (peer_name) {
        checkMedia();
        getPeerInfo();
        joinRoom(peer_name, room_id);
        return;
    }

    let default_name = window.localStorage.peer_name ? window.localStorage.peer_name : '';
    if (getCookie(room_id + '_name')) {
        default_name = getCookie(room_id + '_name');
    }

    if (!BUTTONS.main.startVideoButton) {
        isVideoAllowed = false;
        elemDisplay('initVideo', false);
        elemDisplay('initVideoButton', false);
        elemDisplay('initAudioVideoButton', false);
        elemDisplay('initVideoSelect', false);
        elemDisplay('tabVideoDevicesBtn', false);
    }
    if (!BUTTONS.main.startAudioButton) {
        isAudioAllowed = false;
        elemDisplay('initAudioButton', false);
        elemDisplay('initAudioVideoButton', false);
        elemDisplay('initMicrophoneSelect', false);
        elemDisplay('initSpeakerSelect', false);
        elemDisplay('tabAudioDevicesBtn', false);
    }
    if (!BUTTONS.main.startScreenButton) {
        hide(initStartScreenButton);
    }

    const initUser = document.getElementById('initUser');
    initUser.classList.toggle('hidden');

    Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        background: swalBackground,
        title: 'Elit Live SFU',
        input: 'text',
        inputPlaceholder: 'İsminizi Girin',
        inputAttributes: { maxlength: 32 },
        inputValue: default_name,
        html: initUser, // Inject HTML
        confirmButtonText: `Toplantıya Katıl`,
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
        inputValidator: (name) => {
            if (!name) return 'Lütfen İsminizi Girin';
            if (name.length > 15) return 'Ad maksimum 15 karakter olmalıdır';
            name = filterXSS(name);
            if (isHtml(name)) return 'İsim Alınamaz!';
            if (!getCookie(room_id + '_name')) {
                window.localStorage.peer_name = name;
            }
            setCookie(room_id + '_name', name, 30);
            peer_name = name;
        },
    }).then(() => {
        if (initStream && !joinRoomWithScreen) {
            stopTracks(initStream);
            // hide(initVideo);
            elemDisplay('initVideo', false);
        }
        getPeerInfo();
        joinRoom(peer_name, room_id);
    });

    if (!isVideoAllowed) {
        // hide(initVideo);
        elemDisplay('initVideo', false);
        hide(initVideoSelect);
    }
    if (!isAudioAllowed) {
        hide(initMicrophoneSelect);
        hide(initSpeakerSelect);
    }
}

function handleAudio() {
    isAudioAllowed = isAudioAllowed ? false : true;
    initAudioButton.className = 'fas fa-microphone' + (isAudioAllowed ? '' : '-slash');
    setColor(initAudioButton, isAudioAllowed ? 'white' : 'red');
    setColor(startAudioButton, isAudioAllowed ? 'white' : 'red');
    checkInitAudio(isAudioAllowed);
    lS.setInitConfig(lS.MEDIA_TYPE.audio, isAudioAllowed);
}

function handleVideo() {
    isVideoAllowed = isVideoAllowed ? false : true;
    initVideoButton.className = 'fas fa-video' + (isVideoAllowed ? '' : '-slash');
    setColor(initVideoButton, isVideoAllowed ? 'white' : 'red');
    setColor(startVideoButton, isVideoAllowed ? 'white' : 'red');
    checkInitVideo(isVideoAllowed);
    lS.setInitConfig(lS.MEDIA_TYPE.video, isVideoAllowed);
}

function handleAudioVideo() {
    isAudioVideoAllowed = isAudioVideoAllowed ? false : true;
    isAudioAllowed = isAudioVideoAllowed;
    isVideoAllowed = isAudioVideoAllowed;
    lS.setInitConfig(lS.MEDIA_TYPE.audio, isAudioVideoAllowed);
    lS.setInitConfig(lS.MEDIA_TYPE.video, isAudioVideoAllowed);
    lS.setInitConfig(lS.MEDIA_TYPE.audioVideo, isAudioVideoAllowed);
    initAudioButton.className = 'fas fa-microphone' + (isAudioVideoAllowed ? '' : '-slash');
    initVideoButton.className = 'fas fa-video' + (isAudioVideoAllowed ? '' : '-slash');
    initAudioVideoButton.className = 'fas fa-eye' + (isAudioVideoAllowed ? '' : '-slash');
    if (!isAudioVideoAllowed) {
        hide(initAudioButton);
        hide(initVideoButton);
    }
    setColor(initAudioVideoButton, isAudioVideoAllowed ? 'white' : 'red');
    setColor(initAudioButton, isAudioAllowed ? 'white' : 'red');
    setColor(initVideoButton, isVideoAllowed ? 'white' : 'red');
    setColor(startAudioButton, isAudioAllowed ? 'white' : 'red');
    setColor(startVideoButton, isVideoAllowed ? 'white' : 'red');
    checkInitVideo(isVideoAllowed);
    checkInitAudio(isAudioAllowed);
}

function checkInitVideo(isVideoAllowed) {
    if (isVideoAllowed && BUTTONS.main.startVideoButton) {
        if (initVideoSelect.value) changeCamera(initVideoSelect.value);
        sound('joined');
    } else {
        if (initStream) {
            stopTracks(initStream);
            // hide(initVideo);
            elemDisplay('initVideo', false);
            sound('left');
        }
    }
    initVideoSelect.disabled = !isVideoAllowed;
}

function checkInitAudio(isAudioAllowed) {
    initMicrophoneSelect.disabled = !isAudioAllowed;
    initSpeakerSelect.disabled = !isAudioAllowed;
    isAudioAllowed ? sound('joined') : sound('left');
}

function checkMedia() {
    let qs = new URLSearchParams(window.location.search);
    let audio = filterXSS(qs.get('audio'));
    let video = filterXSS(qs.get('video'));
    if (audio) {
        audio = audio.toLowerCase();
        let queryPeerAudio = audio === '1' || audio === 'true';
        if (queryPeerAudio != null) isAudioAllowed = queryPeerAudio;
    }
    if (video) {
        video = video.toLowerCase();
        let queryPeerVideo = video === '1' || video === 'true';
        if (queryPeerVideo != null) isVideoAllowed = queryPeerVideo;
    }
    // elemDisplay('tabVideoDevicesBtn', isVideoAllowed);
    // elemDisplay('tabAudioDevicesBtn', isAudioAllowed);

    console.log('Direct join', {
        audio: isAudioAllowed,
        video: isVideoAllowed,
    });
}

// ####################################################
// SHARE ROOM
// ####################################################

async function shareRoom(useNavigator = false) {
    if (navigator.share && useNavigator) {
        try {
            await navigator.share({ url: RoomURL });
            userLog('info', 'Room Shared successfully', 'top-end');
        } catch (err) {
            share();
        }
    } else {
        share();
    }
    function share() {
        sound('open');

        Swal.fire({
            background: swalBackground,
            position: 'center',
            title: 'Odayı Paylaş',
            html: `
            <div id="qrRoomContainer">
                <canvas id="qrRoom"></canvas>
            </div>
            <br/>
            <p style="background:transparent; color:rgb(8, 189, 89);">Mobil cihazınızdan katılın</p>
            <p style="background:transparent; color:white; font-family: Arial, Helvetica, sans-serif;">Uygulamalara gerek yok, mobil kameranızla QR kodunu yakalayın veya aşağıdaki URL'yi göndererek başka birini katılmaya davet edin</p>
            <p style="background:transparent; color:rgb(8, 189, 89);">${RoomURL}</p>`,
            showDenyButton: true,
            showCancelButton: true,
            cancelButtonColor: 'red',
            denyButtonColor: 'green',
            confirmButtonText: `Adresi Kopyala`,
            denyButtonText: `E-Posta Daveti`,
            cancelButtonText: `Kapat`,
            showClass: { popup: 'animate__animated animate__fadeInDown' },
            hideClass: { popup: 'animate__animated animate__fadeOutUp' },
        }).then((result) => {
            if (result.isConfirmed) {
                copyRoomURL();
            } else if (result.isDenied) {
                shareRoomByEmail();
            }
            // share screen on join
            if (isScreenAllowed) {
                rc.shareScreen();
            }
        });
        makeRoomQR();
    }
}

// ####################################################
// ROOM UTILITY
// ####################################################

function makeRoomQR() {
    let qr = new QRious({
        element: document.getElementById('qrRoom'),
        value: RoomURL,
    });
    qr.set({
        size: 256,
    });
}

function copyRoomURL() {
    let tmpInput = document.createElement('input');
    document.body.appendChild(tmpInput);
    tmpInput.value = RoomURL;
    tmpInput.select();
    tmpInput.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(tmpInput.value);
    document.body.removeChild(tmpInput);
    userLog('info', 'Meeting URL copied to clipboard 👍', 'top-end');
}

function shareRoomByEmail() {
    Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        background: swalBackground,
        imageUrl: image.email,
        position: 'center',
        title: 'Select a Date and Time',
        html: '<input type="text" id="datetimePicker" class="flatpickr" />',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonColor: 'red',
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
        preConfirm: () => {
            const selectedDateTime = document.getElementById('datetimePicker').value;
            const newLine = '%0D%0A%0D%0A';
            const email = '';
            const emailSubject = `Please join our Elit Live SFU Video Chat Meeting`;
            const emailBody = `The meeting is scheduled at: ${newLine} DateTime: ${selectedDateTime} ${newLine} Click to join: ${RoomURL} ${newLine}`;
            document.location = 'mailto:' + email + '?subject=' + emailSubject + '&body=' + emailBody;
        },
    });
    flatpickr('#datetimePicker', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
    });
}

// ####################################################
// JOIN ROOM
// ####################################################

function joinRoom(peer_name, room_id) {
    if (rc && rc.isConnected()) {
        console.log('Already connected to a room');
    } else {
        console.log('05 ----> join Room ' + room_id);
        roomId.innerText = room_id;
        userName.innerText = peer_name;
        isUserPresenter.innerText = isPresenter;
        rc = new RoomClient(
            localAudio,
            remoteAudios,
            videoMediaContainer,
            videoPinMediaContainer,
            window.mediasoupClient,
            socket,
            room_id,
            peer_name,
            peer_uuid,
            peer_info,
            isAudioAllowed,
            isVideoAllowed,
            isScreenAllowed,
            joinRoomWithScreen,
            isSpeechSynthesisSupported,
            transcription,
            roomIsReady,
        );
        handleRoomClientEvents();
        //notify ? shareRoom() : sound('joined');
    }
}

function roomIsReady() {
    myProfileAvatar.setAttribute('src', rc.genAvatarSvg(peer_name, 64));
    BUTTONS.main.exitButton && show(exitButton);
    BUTTONS.main.shareButton && show(shareButton);
    BUTTONS.main.hideMeButton && show(hideMeButton);
    if (BUTTONS.settings.tabRecording) {
        show(startRecButton);
    } else {
        hide(startRecButton);
        hide(tabRecordingBtn);
    }
    BUTTONS.main.chatButton && show(chatButton);
    BUTTONS.main.raiseHandButton && show(raiseHandButton);
    BUTTONS.main.emojiRoomButton && show(roomEmojiPicker);
    !BUTTONS.chat.chatSaveButton && hide(chatSaveButton);
    BUTTONS.chat.chatEmojiButton && show(chatEmojiButton);
    BUTTONS.chat.chatMarkdownButton && show(chatMarkdownButton);

    isWebkitSpeechRecognitionSupported && BUTTONS.chat.chatSpeechStartButton
        ? show(chatSpeechStartButton)
        : (BUTTONS.chat.chatSpeechStartButton = false);

    transcription.isSupported() && BUTTONS.main.transcriptionButton
        ? show(transcriptionButton)
        : (BUTTONS.main.transcriptionButton = false);

    show(chatCleanTextButton);
    show(chatPasteButton);
    show(chatSendButton);
    if (DetectRTC.isMobileDevice) {
        BUTTONS.main.swapCameraButton && show(swapCameraButton);
        rc.chatMaximize();
        hide(chatTogglePin);
        hide(chatMaxButton);
        hide(chatMinButton);
        transcription.maximize();
        hide(transcriptionTogglePinBtn);
        hide(transcriptionMaxBtn);
        hide(transcriptionMinBtn);
    } else {
        rc.makeDraggable(emojiPickerContainer, emojiPickerHeader);
        rc.makeDraggable(chatRoom, chatHeader);
        rc.makeDraggable(mySettings, mySettingsHeader);
        rc.makeDraggable(whiteboard, whiteboardHeader);
        rc.makeDraggable(sendFileDiv, imgShareSend);
        rc.makeDraggable(receiveFileDiv, imgShareReceive);
        rc.makeDraggable(lobby, lobbyHeader);
        rc.makeDraggable(transcriptionRoom, transcriptionHeader);
        if (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {
            if (BUTTONS.main.startScreenButton) {
                show(startScreenButton);
                show(ScreenFpsDiv);
            }
        }
        BUTTONS.chat.chatPinButton && show(chatTogglePin);
        BUTTONS.chat.chatMaxButton && show(chatMaxButton);
        BUTTONS.settings.pushToTalk && show(pushToTalkDiv);
    }
    if (DetectRTC.browser.name != 'Safari') {
        document.onfullscreenchange = () => {
            if (!document.fullscreenElement) rc.isDocumentOnFullScreen = false;
        };
        show(fullScreenButton);
    }
    BUTTONS.main.whiteboardButton && show(whiteboardButton);
    BUTTONS.main.settingsButton && show(settingsButton);
    isAudioAllowed ? show(stopAudioButton) : BUTTONS.main.startAudioButton && show(startAudioButton);
    isVideoAllowed ? show(stopVideoButton) : BUTTONS.main.startVideoButton && show(startVideoButton);
    show(fileShareButton);
    BUTTONS.settings.lockRoomButton && show(lockRoomButton);
    BUTTONS.settings.lobbyButton && show(lobbyButton);
    BUTTONS.settings.host_only_recording && show(roomRecording);
    BUTTONS.main.aboutButton && show(aboutButton);
    if (!DetectRTC.isMobileDevice) show(pinUnpinGridDiv);
    if (!isSpeechSynthesisSupported) hide(speechMsgDiv);
    handleButtons();
    handleSelects();
    handleInputs();
    handleChatEmojiPicker();
    handleRoomEmojiPicker();
    loadSettingsFromLocalStorage();
    startSessionTimer();
    document.body.addEventListener('mousemove', (e) => {
        showButtons();
    });
    checkButtonsBar();
    if (room_password) {
        lockRoomButton.click();
    }
}

function elemDisplay(element, display, mode = 'block') {
    const elem = document.getElementById(element);
    elem ? (elem.style.display = display ? mode : 'none') : console.error('elemDisplay not found', element);
}

function hide(elem) {
    if (!elem.classList.contains('hidden')) elem.classList.toggle('hidden');
}

function show(elem) {
    if (elem.classList.contains('hidden')) elem.classList.toggle('hidden');
}

function disable(elem, disabled) {
    elem.disabled = disabled;
}

function setColor(elem, color) {
    elem.style.color = color;
}

// ####################################################
// SESSION TIMER
// ####################################################

function startSessionTimer() {
    sessionTime.style.display = 'inline';
    let callStartTime = Date.now();
    setInterval(function printTime() {
        let callElapsedTime = Date.now() - callStartTime;
        sessionTime.innerText = getTimeToString(callElapsedTime);
    }, 1000);
}

function getTimeToString(time) {
    let diffInHrs = time / 3600000;
    let hh = Math.floor(diffInHrs);
    let diffInMin = (diffInHrs - hh) * 60;
    let mm = Math.floor(diffInMin);
    let diffInSec = (diffInMin - mm) * 60;
    let ss = Math.floor(diffInSec);
    let formattedHH = hh.toString().padStart(2, '0');
    let formattedMM = mm.toString().padStart(2, '0');
    let formattedSS = ss.toString().padStart(2, '0');
    return `${formattedHH}:${formattedMM}:${formattedSS}`;
}

// ####################################################
// RECORDING TIMER
// ####################################################

function secondsToHms(d) {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor((d % 3600) / 60);
    let s = Math.floor((d % 3600) % 60);
    let hDisplay = h > 0 ? h + 'h' : '';
    let mDisplay = m > 0 ? m + 'm' : '';
    let sDisplay = s > 0 ? s + 's' : '';
    return hDisplay + ' ' + mDisplay + ' ' + sDisplay;
}

function startRecordingTimer() {
    recElapsedTime = 0;
    recTimer = setInterval(function printTime() {
        if (rc.isRecording()) {
            recElapsedTime++;
            recordingStatus.innerText = secondsToHms(recElapsedTime);
        }
    }, 1000);
}
function stopRecordingTimer() {
    clearInterval(recTimer);
}

// ####################################################
// HTML BUTTONS
// ####################################################

function handleButtons() {
    control.onmouseover = () => {
        isButtonsBarOver = true;
    };
    control.onmouseout = () => {
        isButtonsBarOver = false;
    };
    exitButton.onclick = () => {
        rc.exitRoom();
    };
    shareButton.onclick = () => {
        shareRoom(true);
    };
    hideMeButton.onclick = (e) => {
        isHideMeActive = !isHideMeActive;
        rc.handleHideMe();
    };
    settingsButton.onclick = () => {
        rc.toggleMySettings();
    };
    mySettingsCloseBtn.onclick = () => {
        rc.toggleMySettings();
    };
    tabVideoDevicesBtn.onclick = (e) => {
        rc.openTab(e, 'tabVideoDevices');
    };
    tabAudioDevicesBtn.onclick = (e) => {
        rc.openTab(e, 'tabAudioDevices');
    };
    tabRecordingBtn.onclick = (e) => {
        rc.openTab(e, 'tabRecording');
    };
    tabRoomBtn.onclick = (e) => {
        rc.openTab(e, 'tabRoom');
    };
    tabVideoShareBtn.onclick = (e) => {
        rc.openTab(e, 'tabVideoShare');
    };
    tabAspectBtn.onclick = (e) => {
        rc.openTab(e, 'tabAspect');
    };
    tabModeratorBtn.onclick = (e) => {
        rc.openTab(e, 'tabModerator');
    };
    tabProfileBtn.onclick = (e) => {
        rc.openTab(e, 'tabProfile');
    };
    tabStylingBtn.onclick = (e) => {
        rc.openTab(e, 'tabStyling');
    };
    tabLanguagesBtn.onclick = (e) => {
        rc.openTab(e, 'tabLanguages');
    };
    applyAudioOptionsButton.onclick = () => {
        rc.closeThenProduce(RoomClient.mediaType.audio, microphoneSelect.value);
    };
    speakerTestBtn.onclick = () => {
        sound('ring', true);
    };
    roomId.onclick = () => {
        DetectRTC.isMobileDevice ? shareRoom(true) : copyRoomURL();
    };
    roomSendEmail.onclick = () => {
        shareRoomByEmail();
    };
    chatButton.onclick = () => {
        rc.toggleChat();
        if (rc.isMobileDevice) {
            rc.toggleShowParticipants();
        }
    };
    transcriptionButton.onclick = () => {
        transcription.toggle();
    };
    transcriptionCloseBtn.onclick = () => {
        transcription.toggle();
    };
    transcriptionTogglePinBtn.onclick = () => {
        transcription.togglePinUnpin();
    };
    transcriptionMaxBtn.onclick = () => {
        transcription.maximize();
    };
    transcriptionMinBtn.onclick = () => {
        transcription.minimize();
    };
    transcriptionGhostBtn.onclick = () => {
        transcription.toggleBg();
    };
    transcriptionSaveBtn.onclick = () => {
        transcription.save();
    };
    transcriptionCleanBtn.onclick = () => {
        transcription.delete();
    };
    chatHideParticipantsList.onclick = (e) => {
        rc.toggleShowParticipants();
    };
    chatShowParticipantsList.onclick = (e) => {
        rc.toggleShowParticipants();
    };
    chatShareRoomBtn.onclick = (e) => {
        shareRoom(true);
    };
    chatGhostButton.onclick = (e) => {
        rc.chatToggleBg();
    };
    chatCleanButton.onclick = () => {
        rc.chatClean();
    };
    chatSaveButton.onclick = () => {
        rc.chatSave();
    };
    chatCloseButton.onclick = () => {
        rc.toggleChat();
    };
    chatTogglePin.onclick = () => {
        rc.toggleChatPin();
    };
    chatMaxButton.onclick = () => {
        rc.chatMaximize();
    };
    chatMinButton.onclick = () => {
        rc.chatMinimize();
    };
    chatCleanTextButton.onclick = () => {
        rc.cleanMessage();
    };
    chatPasteButton.onclick = () => {
        rc.pasteMessage();
    };
    chatSendButton.onclick = () => {
        rc.sendMessage();
    };
    chatEmojiButton.onclick = () => {
        rc.toggleChatEmoji();
    };
    chatMarkdownButton.onclick = () => {
        isChatMarkdownOn = !isChatMarkdownOn;
        setColor(chatMarkdownButton, isChatMarkdownOn ? 'lime' : 'white');
    };
    chatSpeechStartButton.onclick = () => {
        startSpeech();
    };
    chatSpeechStopButton.onclick = () => {
        stopSpeech();
    };
    transcriptionSpeechStart.onclick = () => {
        transcription.start();
    };
    transcriptionSpeechStop.onclick = () => {
        transcription.stop();
    };
    fullScreenButton.onclick = () => {
        rc.toggleFullScreen();
    };
    recImage.onclick = () => {
        isRecording ? stopRecButton.click() : startRecButton.click();
    };
    startRecButton.onclick = () => {
        rc.startRecording();
    };
    stopRecButton.onclick = () => {
        rc.stopRecording();
    };
    pauseRecButton.onclick = () => {
        rc.pauseRecording();
    };
    resumeRecButton.onclick = () => {
        rc.resumeRecording();
    };
    swapCameraButton.onclick = () => {
        if (isHideMeActive) rc.handleHideMe();
        rc.closeThenProduce(RoomClient.mediaType.video, null, true);
    };
    raiseHandButton.onclick = () => {
        rc.updatePeerInfo(peer_name, socket.id, 'hand', true);
    };
    lowerHandButton.onclick = () => {
        rc.updatePeerInfo(peer_name, socket.id, 'hand', false);
    };
    startAudioButton.onclick = () => {
        const moderator = rc.getModerator();
        if (moderator.audio_cant_unmute) {
            return userLog('warning', 'The moderator does not allow you to unmute', 'top-end', 6000);
        }
        if (isPushToTalkActive) return;
        setAudioButtonsDisabled(true);
        if (!isEnumerateAudioDevices) initEnumerateAudioDevices();
        rc.produce(RoomClient.mediaType.audio, microphoneSelect.value);
        rc.updatePeerInfo(peer_name, socket.id, 'audio', true);
        // rc.resumeProducer(RoomClient.mediaType.audio);
    };
    stopAudioButton.onclick = () => {
        if (isPushToTalkActive) return;
        setAudioButtonsDisabled(true);
        rc.closeProducer(RoomClient.mediaType.audio);
        rc.updatePeerInfo(peer_name, socket.id, 'audio', false);
        // rc.pauseProducer(RoomClient.mediaType.audio);
    };
    startVideoButton.onclick = () => {
        const moderator = rc.getModerator();
        if (moderator.video_cant_unhide) {
            return userLog('warning', 'The moderator does not allow you to unhide', 'top-end', 6000);
        }
        setVideoButtonsDisabled(true);
        if (!isEnumerateVideoDevices) initEnumerateVideoDevices();
        rc.produce(RoomClient.mediaType.video, videoSelect.value);
        // rc.resumeProducer(RoomClient.mediaType.video);
    };
    stopVideoButton.onclick = () => {
        setVideoButtonsDisabled(true);
        rc.closeProducer(RoomClient.mediaType.video);
        // rc.pauseProducer(RoomClient.mediaType.video);
    };
    startScreenButton.onclick = () => {
        const moderator = rc.getModerator();
        if (moderator.screen_cant_share) {
            return userLog('warning', 'The moderator does not allow you to share the screen', 'top-end', 6000);
        }
        rc.produce(RoomClient.mediaType.screen);
    };
    stopScreenButton.onclick = () => {
        rc.closeProducer(RoomClient.mediaType.screen);
    };
    fileShareButton.onclick = () => {
        rc.selectFileToShare(socket.id, true);
    };
    videoShareButton.onclick = () => {
        rc.shareVideo('all');
    };
    videoCloseBtn.onclick = () => {
        rc.closeVideo(true);
    };
    sendAbortBtn.onclick = () => {
        rc.abortFileTransfer();
    };
    receiveHideBtn.onclick = () => {
        rc.hideFileTransfer();
    };
    whiteboardButton.onclick = () => {
        toggleWhiteboard();
    };
    whiteboardPencilBtn.onclick = () => {
        whiteboardIsDrawingMode(true);
    };
    whiteboardObjectBtn.onclick = () => {
        whiteboardIsDrawingMode(false);
    };
    whiteboardUndoBtn.onclick = () => {
        whiteboardAction(getWhiteboardAction('undo'));
    };
    whiteboardRedoBtn.onclick = () => {
        whiteboardAction(getWhiteboardAction('redo'));
    };
    whiteboardSaveBtn.onclick = () => {
        wbCanvasSaveImg();
    };
    whiteboardImgFileBtn.onclick = () => {
        whiteboardAddObj('imgFile');
    };
    whiteboardPdfFileBtn.onclick = () => {
        whiteboardAddObj('pdfFile');
    };
    whiteboardImgUrlBtn.onclick = () => {
        whiteboardAddObj('imgUrl');
    };
    whiteboardTextBtn.onclick = () => {
        whiteboardAddObj('text');
    };
    whiteboardLineBtn.onclick = () => {
        whiteboardAddObj('line');
    };
    whiteboardRectBtn.onclick = () => {
        whiteboardAddObj('rect');
    };
    whiteboardTriangleBtn.onclick = () => {
        whiteboardAddObj('triangle');
    };
    whiteboardCircleBtn.onclick = () => {
        whiteboardAddObj('circle');
    };
    whiteboardEraserBtn.onclick = () => {
        whiteboardIsEraser(true);
    };
    whiteboardCleanBtn.onclick = () => {
        confirmClearBoard();
    };
    whiteboardLockButton.onchange = () => {
        wbIsLock = !wbIsLock;
        whiteboardAction(getWhiteboardAction(wbIsLock ? 'lock' : 'unlock'));
    };
    whiteboardCloseBtn.onclick = () => {
        whiteboardAction(getWhiteboardAction('close'));
    };
    participantsSaveBtn.onclick = () => {
        saveRoomPeers();
    };
    participantsUnreadMessagesBtn.onclick = () => {
        rc.toggleUnreadMsg();
    };
    searchParticipantsFromList.onkeyup = () => {
        rc.searchPeer();
    };
    lockRoomButton.onclick = () => {
        rc.roomAction('lock');
    };
    unlockRoomButton.onclick = () => {
        rc.roomAction('unlock');
    };
    aboutButton.onclick = () => {
        showAbout();
    };
}

// ####################################################
// HANDLE INIT USER
// ####################################################

function setButtonsInit() {
    if (!DetectRTC.isMobileDevice) {
        setTippy('initAudioButton', 'Ses Aç/Kapa', 'top');
        setTippy('initVideoButton', 'Kamera Aç/Kapa', 'top');
        setTippy('initAudioVideoButton', 'Sesi ve Görüntüyü Aç/Kapa', 'top');
        setTippy('initStartScreenButton', 'Ekran Paylaşımını Aç', 'top');
        setTippy('initStopScreenButton', 'Ekran Paylaşımını Kapat', 'top');

    }
    initAudioButton = document.getElementById('initAudioButton');
    initVideoButton = document.getElementById('initVideoButton');
    initAudioVideoButton = document.getElementById('initAudioVideoButton');
    if (!isAudioAllowed) hide(initAudioButton);
    if (!isVideoAllowed) hide(initVideoButton);
    if (!isAudioAllowed || !isVideoAllowed) hide(initAudioVideoButton);
    isAudioVideoAllowed = isAudioAllowed && isVideoAllowed;
}

function handleSelectsInit() {
    // devices init options
    initVideoSelect.onchange = () => {
        changeCamera(initVideoSelect.value);
        videoSelect.selectedIndex = initVideoSelect.selectedIndex;
        lS.setLocalStorageDevices(lS.MEDIA_TYPE.video, videoSelect.selectedIndex, videoSelect.value);
    };
    initMicrophoneSelect.onchange = () => {
        microphoneSelect.selectedIndex = initMicrophoneSelect.selectedIndex;
        lS.setLocalStorageDevices(lS.MEDIA_TYPE.audio, microphoneSelect.selectedIndex, microphoneSelect.value);
    };
    initSpeakerSelect.onchange = () => {
        speakerSelect.selectedIndex = initSpeakerSelect.selectedIndex;
        lS.setLocalStorageDevices(lS.MEDIA_TYPE.speaker, initSpeakerSelect.selectedIndex, initSpeakerSelect.value);
    };
}

function setSelectsInit() {
    const localStorageDevices = lS.getLocalStorageDevices();
    console.log('04 ----> Get Local Storage Devices before', localStorageDevices);
    if (localStorageDevices) {
        initMicrophoneSelect.selectedIndex = localStorageDevices.audio.index;
        initSpeakerSelect.selectedIndex = localStorageDevices.speaker.index;
        initVideoSelect.selectedIndex = localStorageDevices.video.index;
        //
        microphoneSelect.selectedIndex = initMicrophoneSelect.selectedIndex;
        speakerSelect.selectedIndex = initSpeakerSelect.selectedIndex;
        videoSelect.selectedIndex = initVideoSelect.selectedIndex;
        //
        if (lS.DEVICES_COUNT.audio != localStorageDevices.audio.count) {
            console.log('04.1 ----> Audio devices seems changed, use default index 0');
            initMicrophoneSelect.selectedIndex = 0;
            microphoneSelect.selectedIndex = 0;
            lS.setLocalStorageDevices(
                lS.MEDIA_TYPE.audio,
                initMicrophoneSelect.selectedIndex,
                initMicrophoneSelect.value,
            );
        }
        if (lS.DEVICES_COUNT.speaker != localStorageDevices.speaker.count) {
            console.log('04.2 ----> Speaker devices seems changed, use default index 0');
            initSpeakerSelect.selectedIndex = 0;
            speakerSelect.selectedIndex = 0;
            lS.setLocalStorageDevices(
                lS.MEDIA_TYPE.speaker,
                initSpeakerSelect.selectedIndexIndex,
                initSpeakerSelect.value,
            );
        }
        if (lS.DEVICES_COUNT.video != localStorageDevices.video.count) {
            console.log('04.3 ----> Video devices seems changed, use default index 0');
            initVideoSelect.selectedIndex = 0;
            videoSelect.selectedIndex = 0;
            lS.setLocalStorageDevices(lS.MEDIA_TYPE.video, initVideoSelect.selectedIndex, initVideoSelect.value);
        }
        //
        console.log('04.4 ----> Get Local Storage Devices after', lS.getLocalStorageDevices());
    }
    if (initVideoSelect.value) changeCamera(initVideoSelect.value);
}

async function changeCamera(deviceId) {
    if (initStream) {
        stopTracks(initStream);
        //show(initVideo);
        elemDisplay('initVideo', true);
        if (!initVideo.classList.contains('mirror')) {
            initVideo.classList.toggle('mirror');
        }
    }
    const videoConstraints = {
        audio: false,
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            deviceId: deviceId,
            aspectRatio: 1.777,
            frameRate: {
                min: 5,
                ideal: 15,
                max: 30,
            },
        },
    };
    navigator.mediaDevices
        .getUserMedia(videoConstraints)
        .then((camStream) => {
            initVideo.className = 'mirror';
            initVideo.srcObject = camStream;
            initStream = camStream;
            console.log(
                '04.5 ----> Success attached init cam video stream',
                initStream.getVideoTracks()[0].getSettings(),
            );
            checkInitConfig();
        })
        .catch((err) => {
            console.error('[Error] changeCamera', err);
            userLog('error', 'Error while swapping camera' + err, 'top-end');
        });
}

async function toggleScreenSharing() {
    if (initStream) {
        stopTracks(initStream);
        //show(initVideo);
        elemDisplay('initVideo', true);
    }
    joinRoomWithScreen = !joinRoomWithScreen;
    if (joinRoomWithScreen) {
        navigator.mediaDevices
            .getDisplayMedia({ audio: true, video: true })
            .then((screenStream) => {
                if (initVideo.classList.contains('mirror')) {
                    initVideo.classList.toggle('mirror');
                }
                initVideo.srcObject = screenStream;
                initStream = screenStream;
                console.log('04.6 ----> Success attached init screen video stream', initStream);
                show(initStopScreenButton);
                hide(initStartScreenButton);
                disable(initVideoSelect, true);
                disable(initVideoButton, true);
                disable(initAudioVideoButton, true);
            })
            .catch((err) => {
                console.error('[Error] toggleScreenSharing', err);
                joinRoomWithScreen = false;
                return checkInitVideo(isVideoAllowed);
            });
    } else {
        checkInitVideo(isVideoAllowed);
        hide(initStopScreenButton);
        show(initStartScreenButton);
        disable(initVideoSelect, false);
        disable(initVideoButton, false);
        disable(initAudioVideoButton, false);
    }
}

function handleSelects() {
    // devices options
    videoSelect.onchange = () => {
        rc.closeThenProduce(RoomClient.mediaType.video, videoSelect.value);
        lS.setLocalStorageDevices(lS.MEDIA_TYPE.video, videoSelect.selectedIndex, videoSelect.value);
    };
    videoQuality.onchange = () => {
        rc.closeThenProduce(RoomClient.mediaType.video, videoSelect.value);
    };
    videoFps.onchange = () => {
        rc.closeThenProduce(RoomClient.mediaType.video, videoSelect.value);
        lsSettings.video_fps = videoFps.selectedIndex;
        lS.setSettings(lsSettings);
    };
    screenFps.onchange = () => {
        rc.closeThenProduce(RoomClient.mediaType.screen);
        lsSettings.screen_fps = screenFps.selectedIndex;
        lS.setSettings(lsSettings);
    };
    microphoneSelect.onchange = () => {
        rc.closeThenProduce(RoomClient.mediaType.audio, microphoneSelect.value);
        lS.setLocalStorageDevices(lS.MEDIA_TYPE.audio, microphoneSelect.selectedIndex, microphoneSelect.value);
    };
    initSpeakerSelect.onchange = () => {
        rc.attachSinkId(rc.myAudioEl, initSpeakerSelect.value);
        lS.setLocalStorageDevices(lS.MEDIA_TYPE.speaker, initSpeakerSelect.selectedIndex, initSpeakerSelect.value);
    };
    switchPushToTalk.onchange = (e) => {
        const producerExist = rc.producerExist(RoomClient.mediaType.audio);
        if (!producerExist && !isPushToTalkActive) {
            console.log('Push-to-talk: start audio producer');
            setAudioButtonsDisabled(true);
            if (!isEnumerateAudioDevices) initEnumerateAudioDevices();
            rc.produce(RoomClient.mediaType.audio, microphoneSelect.value);
            setTimeout(function () {
                rc.pauseProducer(RoomClient.mediaType.audio);
                rc.updatePeerInfo(peer_name, socket.id, 'audio', false);
            }, 1000);
        }
        isPushToTalkActive = !isPushToTalkActive;
        if (producerExist && !isPushToTalkActive) {
            console.log('Push-to-talk: resume audio producer');
            rc.resumeProducer(RoomClient.mediaType.audio);
            rc.updatePeerInfo(peer_name, socket.id, 'audio', true);
        }
        e.target.blur(); // Removes focus from the element
        rc.roomMessage('ptt', isPushToTalkActive);
        console.log(`Push-to-talk enabled: ${isPushToTalkActive}`);
    };
    document.addEventListener('keydown', (e) => {
        if (!isPushToTalkActive) return;
        if (e.code === 'Space') {
            if (isSpaceDown) return;
            rc.resumeProducer(RoomClient.mediaType.audio);
            rc.updatePeerInfo(peer_name, socket.id, 'audio', true);
            isSpaceDown = true;
            console.log('Push-to-talk: audio resumed');
        }
    });
    document.addEventListener('keyup', (e) => {
        if (!isPushToTalkActive) return;
        if (e.code === 'Space') {
            rc.pauseProducer(RoomClient.mediaType.audio);
            rc.updatePeerInfo(peer_name, socket.id, 'audio', false);
            isSpaceDown = false;
            console.log('Push-to-talk: audio paused');
        }
    });
    // room
    switchLobby.onchange = (e) => {
        isLobbyEnabled = e.currentTarget.checked;
        rc.roomAction(isLobbyEnabled ? 'lobbyOn' : 'lobbyOff');
        rc.lobbyToggle();
        lsSettings.lobby = isLobbyEnabled;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchPitchBar.onchange = (e) => {
        isPitchBarEnabled = e.currentTarget.checked;
        rc.roomMessage('pitchBar', isPitchBarEnabled);
        lsSettings.pitch_bar = isPitchBarEnabled;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchSounds.onchange = (e) => {
        isSoundEnabled = e.currentTarget.checked;
        rc.roomMessage('sounds', isSoundEnabled);
        lsSettings.sounds = isSoundEnabled;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchShare.onchange = (e) => {
        notify = e.currentTarget.checked;
        rc.roomMessage('notify', notify);
        lsSettings.share_on_join = notify;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    // audio options
    switchAutoGainControl.onchange = (e) => {
        lsSettings.mic_auto_gain_control = e.currentTarget.checked;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchEchoCancellation.onchange = (e) => {
        lsSettings.mic_echo_cancellations = e.currentTarget.checked;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchNoiseSuppression.onchange = (e) => {
        lsSettings.mic_noise_suppression = e.currentTarget.checked;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    sampleRateSelect.onchange = (e) => {
        lsSettings.mic_sample_rate = e.currentTarget.selectedIndex;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    sampleSizeSelect.onchange = (e) => {
        lsSettings.mic_sample_size = e.currentTarget.selectedIndex;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    channelCountSelect.onchange = (e) => {
        lsSettings.mic_channel_count = e.currentTarget.selectedIndex;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    micLatencyRange.oninput = (e) => {
        lsSettings.mic_latency = e.currentTarget.value;
        lS.setSettings(lsSettings);
        micLatencyValue.innerText = e.currentTarget.value;
        e.target.blur();
    };
    micVolumeRange.oninput = (e) => {
        lsSettings.mic_volume = e.currentTarget.value;
        lS.setSettings(lsSettings);
        micVolumeValue.innerText = e.currentTarget.value;
        e.target.blur();
    };
    // recording
    switchHostOnlyRecording.onchange = (e) => {
        hostOnlyRecording = e.currentTarget.checked;
        rc.roomAction(hostOnlyRecording ? 'hostOnlyRecordingOn' : 'hostOnlyRecordingOff');
        lsSettings.host_only_recording = hostOnlyRecording;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    // styling
    BtnAspectRatio.onchange = () => {
        setAspectRatio(BtnAspectRatio.value);
    };
    BtnVideoObjectFit.onchange = () => {
        rc.handleVideoObjectFit(BtnVideoObjectFit.value);
        lsSettings.video_obj_fit = BtnVideoObjectFit.selectedIndex;
        lS.setSettings(lsSettings);
    }; // cover
    BtnVideoControls.onchange = () => {
        rc.handleVideoControls(BtnVideoControls.value);
        lsSettings.video_controls = BtnVideoControls.selectedIndex;
        lS.setSettings(lsSettings);
    };
    selectTheme.onchange = () => {
        lsSettings.theme = selectTheme.selectedIndex;
        lS.setSettings(lsSettings);
        setTheme();
    };
    BtnsBarPosition.onchange = () => {
        rc.changeBtnsBarPosition(BtnsBarPosition.value);
        lsSettings.buttons_bar = BtnsBarPosition.selectedIndex;
        lS.setSettings(lsSettings);
        refreshMainButtonsToolTipPlacement();
    };
    pinVideoPosition.onchange = () => {
        rc.toggleVideoPin(pinVideoPosition.value);
        lsSettings.pin_grid = pinVideoPosition.selectedIndex;
        lS.setSettings(lsSettings);
    };
    // chat
    showChatOnMsg.onchange = (e) => {
        rc.showChatOnMessage = e.currentTarget.checked;
        rc.roomMessage('showChat', rc.showChatOnMessage);
        lsSettings.show_chat_on_msg = rc.showChatOnMessage;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    speechIncomingMsg.onchange = (e) => {
        rc.speechInMessages = e.currentTarget.checked;
        rc.roomMessage('speechMessages', rc.speechInMessages);
        lsSettings.speech_in_msg = rc.speechInMessages;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    // transcript
    transcriptShowOnMsg.onchange = (e) => {
        transcription.showOnMessage = e.currentTarget.checked;
        rc.roomMessage('showTranscript', transcription.showOnMessage);
        lsSettings.show_transcript_on_msg = transcription.showOnMessage;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    // whiteboard options
    wbDrawingColorEl.onchange = () => {
        wbCanvas.freeDrawingBrush.color = wbDrawingColorEl.value;
        whiteboardIsDrawingMode(true);
    };
    wbBackgroundColorEl.onchange = () => {
        setWhiteboardBgColor(wbBackgroundColorEl.value);
    };
    whiteboardGhostButton.onclick = (e) => {
        wbIsBgTransparent = !wbIsBgTransparent;
        wbIsBgTransparent ? wbCanvasBackgroundColor('rgba(0, 0, 0, 0.100)') : setTheme();
    };
    // room moderator rules
    switchEveryoneMute.onchange = (e) => {
        const audioStartMuted = e.currentTarget.checked;
        rc.updateRoomModerator({ type: 'audio_start_muted', status: audioStartMuted });
        rc.roomMessage('audio_start_muted', audioStartMuted);
        lsSettings.moderator_audio_start_muted = audioStartMuted;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchEveryoneHidden.onchange = (e) => {
        const videoStartHidden = e.currentTarget.checked;
        rc.updateRoomModerator({ type: 'video_start_hidden', status: videoStartHidden });
        rc.roomMessage('video_start_hidden', videoStartHidden);
        lsSettings.moderator_video_start_hidden = videoStartHidden;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchEveryoneCantUnmute.onchange = (e) => {
        const audioCantUnmute = e.currentTarget.checked;
        rc.updateRoomModerator({ type: 'audio_cant_unmute', status: audioCantUnmute });
        rc.roomMessage('audio_cant_unmute', audioCantUnmute);
        lsSettings.moderator_audio_cant_unmute = audioCantUnmute;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchEveryoneCantUnhide.onchange = (e) => {
        const videoCantUnhide = e.currentTarget.checked;
        rc.updateRoomModerator({ type: 'video_cant_unhide', status: videoCantUnhide });
        rc.roomMessage('video_cant_unhide', videoCantUnhide);
        lsSettings.moderator_video_cant_unhide = videoCantUnhide;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
    switchEveryoneCantShareScreen.onchange = (e) => {
        const screenCantShare = e.currentTarget.checked;
        rc.updateRoomModerator({ type: 'screen_cant_share', status: screenCantShare });
        rc.roomMessage('screen_cant_share', screenCantShare);
        lsSettings.moderator_screen_cant_share = screenCantShare;
        lS.setSettings(lsSettings);
        e.target.blur();
    };
}

// ####################################################
// HTML INPUTS
// ####################################################

function handleInputs() {
    chatMessage.onkeyup = (e) => {
        if (e.keyCode === 13 && (DetectRTC.isMobileDevice || !e.shiftKey)) {
            e.preventDefault();
            chatSendButton.click();
        }
    };
    chatMessage.oninput = function () {
        const chatInputEmoji = {
            '<3': '❤️',
            '</3': '💔',
            ':D': '😀',
            ':)': '😃',
            ';)': '😉',
            ':(': '😒',
            ':p': '😛',
            ';p': '😜',
            ":'(": '😢',
            ':+1:': '👍',
            ':*': '😘',
            ':O': '😲',
            ':|': '😐',
            ':*(': '😭',
            XD: '😆',
            ':B': '😎',
            ':P': '😜',
            '<(': '👎',
            '>:(': '😡',
            ':S': '😟',
            ':X': '🤐',
            ';(': '😥',
            ':T': '😖',
            ':@': '😠',
            ':$': '🤑',
            ':&': '🤗',
            ':#': '🤔',
            ':!': '😵',
            ':W': '😷',
            ':%': '🤒',
            ':*!': '🤩',
            ':G': '😬',
            ':R': '😋',
            ':M': '🤮',
            ':L': '🥴',
            ':C': '🥺',
            ':F': '🥳',
            ':Z': '🤢',
            ':^': '🤓',
            ':K': '🤫',
            ':D!': '🤯',
            ':H': '🧐',
            ':U': '🤥',
            ':V': '🤪',
            ':N': '🥶',
            ':J': '🥴',
        };
        for (let i in chatInputEmoji) {
            let regex = new RegExp(i.replace(/([()[{*+.$^\\|?])/g, '\\$1'), 'gim');
            this.value = this.value.replace(regex, chatInputEmoji[i]);
        }
        rc.checkLineBreaks();
    };

    chatMessage.onpaste = () => {
        isChatPasteTxt = true;
        rc.checkLineBreaks();
    };
}

// ####################################################
// EMOJI PIKER
// ####################################################

function handleChatEmojiPicker() {
    const pickerOptions = {
        theme: 'dark',
        onEmojiSelect: addEmojiToMsg,
    };
    const emojiPicker = new EmojiMart.Picker(pickerOptions);
    rc.getId('chatEmoji').appendChild(emojiPicker);

    function addEmojiToMsg(data) {
        chatMessage.value += data.native;
        rc.toggleChatEmoji();
    }
}

function handleRoomEmojiPicker() {
    const pickerRoomOptions = {
        theme: 'dark',
        onEmojiSelect: sendEmojiToRoom,
    };

    const emojiRoomPicker = new EmojiMart.Picker(pickerRoomOptions);
    emojiPickerContainer.appendChild(emojiRoomPicker);
    emojiPickerContainer.style.display = 'none';

    roomEmojiPicker.onclick = () => {
        toggleEmojiPicker();
    };
    closeEmojiPickerContainer.onclick = () => {
        toggleEmojiPicker();
    };

    function sendEmojiToRoom(data) {
        console.log('Selected Emoji:', data.native);
        const cmd = {
            type: 'roomEmoji',
            peer_name: peer_name,
            emoji: data.native,
        };
        if (rc.thereAreParticipants()) {
            rc.emitCmd(cmd);
        }
        rc.handleCmd(cmd);
        // toggleEmojiPicker();
    }

    function toggleEmojiPicker() {
        if (emojiPickerContainer.style.display === 'block') {
            emojiPickerContainer.style.display = 'none';
            setColor(roomEmojiPicker, 'white');
        } else {
            emojiPickerContainer.style.display = 'block';
            setColor(roomEmojiPicker, 'yellow');
        }
    }
}

// ####################################################
// LOAD SETTINGS FROM LOCAL STORAGE
// ####################################################

function loadSettingsFromLocalStorage() {
    rc.showChatOnMessage = lsSettings.show_chat_on_msg;
    transcription.showOnMessage = lsSettings.show_transcript_on_msg;
    rc.speechInMessages = lsSettings.speech_in_msg;
    isPitchBarEnabled = lsSettings.pitch_bar;
    isSoundEnabled = lsSettings.sounds;
    showChatOnMsg.checked = rc.showChatOnMessage;
    transcriptShowOnMsg.checked = transcription.showOnMessage;
    speechIncomingMsg.checked = rc.speechInMessages;
    switchPitchBar.checked = isPitchBarEnabled;
    switchSounds.checked = isSoundEnabled;
    switchShare.checked = notify;

    switchAutoGainControl.checked = lsSettings.mic_auto_gain_control;
    switchEchoCancellation.checked = lsSettings.mic_echo_cancellations;
    switchNoiseSuppression.checked = lsSettings.mic_noise_suppression;
    sampleRateSelect.selectedIndex = lsSettings.mic_sample_rate;
    sampleSizeSelect.selectedIndex = lsSettings.mic_sample_size;
    channelCountSelect.selectedIndex = lsSettings.mic_channel_count;

    micLatencyRange.value = lsSettings.mic_latency || 50;
    micLatencyValue.innerText = lsSettings.mic_latency || 50;
    micVolumeRange.value = lsSettings.mic_volume || 100;
    micVolumeValue.innerText = lsSettings.mic_volume || 100;

    videoFps.selectedIndex = lsSettings.video_fps;
    screenFps.selectedIndex = lsSettings.screen_fps;
    BtnVideoObjectFit.selectedIndex = lsSettings.video_obj_fit;
    BtnVideoControls.selectedIndex = lsSettings.video_controls;
    BtnsBarPosition.selectedIndex = lsSettings.buttons_bar;
    pinVideoPosition.selectedIndex = lsSettings.pin_grid;
    rc.handleVideoObjectFit(BtnVideoObjectFit.value);
    rc.handleVideoControls(BtnVideoControls.value);
    rc.changeBtnsBarPosition(BtnsBarPosition.value);
    rc.toggleVideoPin(pinVideoPosition.value);
    refreshMainButtonsToolTipPlacement();
}

// ####################################################
// ROOM CLIENT EVENT LISTNERS
// ####################################################

function handleRoomClientEvents() {
    rc.on(RoomClient.EVENTS.startRec, () => {
        console.log('Room event: Client start recoding');
        hide(startRecButton);
        show(stopRecButton);
        show(pauseRecButton);
        show(recordingTime);
        startRecordingTimer();
        isRecording = true;
        rc.updatePeerInfo(peer_name, socket.id, 'recording', true);
    });
    rc.on(RoomClient.EVENTS.pauseRec, () => {
        console.log('Room event: Client pause recoding');
        hide(pauseRecButton);
        show(resumeRecButton);
    });
    rc.on(RoomClient.EVENTS.resumeRec, () => {
        console.log('Room event: Client resume recoding');
        hide(resumeRecButton);
        show(pauseRecButton);
    });
    rc.on(RoomClient.EVENTS.stopRec, () => {
        console.log('Room event: Client stop recoding');
        hide(stopRecButton);
        hide(pauseRecButton);
        hide(resumeRecButton);
        hide(recordingTime);
        show(startRecButton);
        stopRecordingTimer();
        isRecording = false;
        rc.updatePeerInfo(peer_name, socket.id, 'recording', false);
    });
    rc.on(RoomClient.EVENTS.raiseHand, () => {
        console.log('Room event: Client raise hand');
        hide(raiseHandButton);
        show(lowerHandButton);
        setColor(lowerHandIcon, 'lime');
    });
    rc.on(RoomClient.EVENTS.lowerHand, () => {
        console.log('Room event: Client lower hand');
        hide(lowerHandButton);
        show(raiseHandButton);
        setColor(lowerHandIcon, 'white');
    });
    rc.on(RoomClient.EVENTS.startAudio, () => {
        console.log('Room event: Client start audio');
        hide(startAudioButton);
        show(stopAudioButton);
        setColor(startAudioButton, 'red');
        setAudioButtonsDisabled(false);
    });
    rc.on(RoomClient.EVENTS.pauseAudio, () => {
        console.log('Room event: Client pause audio');
        hide(stopAudioButton);
        show(startAudioButton);
    });
    rc.on(RoomClient.EVENTS.resumeAudio, () => {
        console.log('Room event: Client resume audio');
        hide(startAudioButton);
        show(stopAudioButton);
    });
    rc.on(RoomClient.EVENTS.stopAudio, () => {
        console.log('Room event: Client stop audio');
        hide(stopAudioButton);
        show(startAudioButton);
        setAudioButtonsDisabled(false);
        stopMicrophoneProcessing();
    });
    rc.on(RoomClient.EVENTS.startVideo, () => {
        console.log('Room event: Client start video');
        hide(startVideoButton);
        show(stopVideoButton);
        setColor(startVideoButton, 'red');
        setVideoButtonsDisabled(false);
        // if (isParticipantsListOpen) getRoomParticipants();
    });
    rc.on(RoomClient.EVENTS.pauseVideo, () => {
        console.log('Room event: Client pause video');
        hide(stopVideoButton);
        show(startVideoButton);
    });
    rc.on(RoomClient.EVENTS.resumeVideo, () => {
        console.log('Room event: Client resume video');
        hide(startVideoButton);
        show(stopVideoButton);
    });
    rc.on(RoomClient.EVENTS.stopVideo, () => {
        console.log('Room event: Client stop video');
        hide(stopVideoButton);
        show(startVideoButton);
        setVideoButtonsDisabled(false);
        isVideoPrivacyActive = false;
        // if (isParticipantsListOpen) getRoomParticipants();
    });
    rc.on(RoomClient.EVENTS.startScreen, () => {
        console.log('Room event: Client start screen');
        hide(startScreenButton);
        show(stopScreenButton);
        // if (isParticipantsListOpen) getRoomParticipants();
    });
    rc.on(RoomClient.EVENTS.pauseScreen, () => {
        console.log('Room event: Client pause screen');
    });
    rc.on(RoomClient.EVENTS.resumeScreen, () => {
        console.log('Room event: Client resume screen');
    });
    rc.on(RoomClient.EVENTS.stopScreen, () => {
        console.log('Room event: Client stop screen');
        hide(stopScreenButton);
        show(startScreenButton);
        // if (isParticipantsListOpen) getRoomParticipants();
    });
    rc.on(RoomClient.EVENTS.roomLock, () => {
        console.log('Room event: Client lock room');
        hide(lockRoomButton);
        show(unlockRoomButton);
        setColor(unlockRoomButton, 'red');
        isRoomLocked = true;
    });
    rc.on(RoomClient.EVENTS.roomUnlock, () => {
        console.log('Room event: Client unlock room');
        hide(unlockRoomButton);
        show(lockRoomButton);
        isRoomLocked = false;
    });
    rc.on(RoomClient.EVENTS.lobbyOn, () => {
        console.log('Room event: Client room lobby enabled');
        if (isRulesActive && !isPresenter) {
            hide(lobbyButton);
        }
        sound('lobby');
        isLobbyEnabled = true;
    });
    rc.on(RoomClient.EVENTS.lobbyOff, () => {
        console.log('Room event: Client room lobby disabled');
        isLobbyEnabled = false;
    });
    rc.on(RoomClient.EVENTS.hostOnlyRecordingOn, () => {
        if (isRulesActive && !isPresenter) {
            console.log('Room event: host only recording enabled');
            // Stop recording ...
            if (rc.isRecording() || recordingStatus.innerText != '0s') {
                console.log('Room event: host only recording enabled, going to stop recording');
                rc.stopRecording();
            }
            hide(startRecButton);
            hide(roomRecording);
            show(recordingMessage);
            hostOnlyRecording = true;
        }
    });
    rc.on(RoomClient.EVENTS.hostOnlyRecordingOff, () => {
        if (isRulesActive && !isPresenter) {
            console.log('Room event: host only recording disabled');
            show(startRecButton);
            hide(roomRecording);
            hide(recordingMessage);
            hostOnlyRecording = false;
        }
    });
    rc.on(RoomClient.EVENTS.exitRoom, () => {
        console.log('Room event: Client leave room');
        if (rc.isRecording() || recordingStatus.innerText != '0s') {
            console.log('Room event: Client save recording before to exit');
            rc.stopRecording();
        }
        if (survey && survey.enabled) {
            leaveFeedback();
        } else {
            redirectOnLeave();
        }
    });
}

// ####################################################
// UTILITY
// ####################################################

function leaveFeedback() {
    Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        showDenyButton: true,
        background: swalBackground,
        imageUrl: image.feedback,
        title: 'Leave a feedback',
        text: 'Do you want to rate your Elit Live experience?',
        confirmButtonText: `Yes`,
        denyButtonText: `No`,
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
    }).then((result) => {
        if (result.isConfirmed) {
            openURL(survey.url);
        } else {
            redirectOnLeave();
        }
    });
}

function redirectOnLeave() {
    redirect && redirect.enabled ? openURL(redirect.url) : openURL('/newroom');
}

function userLog(icon, message, position, timer = 3000) {
    const Toast = Swal.mixin({
        background: swalBackground,
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
    });
    Toast.fire({
        icon: icon,
        title: message,
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
    });
}

function saveDataToFile(dataURL, fileName) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = dataURL;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(dataURL);
    }, 100);
}

function saveObjToJsonFile(dataObj, name) {
    console.log('Save data', { dataObj: dataObj, name: name });
    const dataTime = getDataTimeString();
    let a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataObj, null, 1));
    a.download = `${dataTime}-${name}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
    sound('download');
}

function getDataTimeString() {
    const d = new Date();
    const date = d.toISOString().split('T')[0];
    const time = d.toTimeString().split(' ')[0];
    return `${date}-${time}`;
}

function getUUID() {
    const uuid4 = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
    );
    if (window.localStorage.uuid) {
        return window.localStorage.uuid;
    }
    window.localStorage.uuid = uuid4;
    return uuid4;
}

function showButtons() {
    if (
        isButtonsBarOver ||
        isButtonsVisible ||
        (rc.isMobileDevice && rc.isChatOpen) ||
        (rc.isMobileDevice && rc.isMySettingsOpen)
    )
        return;
    toggleClassElements('videoMenuBar', 'inline');
    control.style.display = 'flex';
    isButtonsVisible = true;
}

function checkButtonsBar() {
    if (!isButtonsBarOver) {
        toggleClassElements('videoMenuBar', 'none');
        control.style.display = 'none';
        isButtonsVisible = false;
    }
    setTimeout(() => {
        checkButtonsBar();
    }, 10000);
}

function toggleClassElements(className, displayState) {
    let elements = rc.getEcN(className);
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = displayState;
    }
}

function setAudioButtonsDisabled(disabled) {
    startAudioButton.disabled = disabled;
    stopAudioButton.disabled = disabled;
}

function setVideoButtonsDisabled(disabled) {
    startVideoButton.disabled = disabled;
    stopVideoButton.disabled = disabled;
}

async function sound(name, force = false) {
    if (!isSoundEnabled && !force) return;
    let sound = '../sounds/' + name + '.wav';
    let audio = new Audio(sound);
    try {
        audio.volume = 0.5;
        await audio.play();
    } catch (err) {
        return false;
    }
}

function isImageURL(url) {
    return url.match(/\.(jpeg|jpg|gif|png|tiff|bmp)$/) != null;
}

function isMobile(userAgent) {
    return !!/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent || '');
}

function isTablet(userAgent) {
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
        userAgent,
    );
}

function isIpad(userAgent) {
    return /macintosh/.test(userAgent) && 'ontouchend' in document;
}

function openURL(url, blank = false) {
    blank ? window.open(url, '_blank') : (window.location.href = url);
}

function bytesToSize(bytes) {
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function setCookie(name, value, expDays) {
    let date = new Date();
    date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + '; ' + expires + '; path=/';
}

function getCookie(cName) {
    const name = cName + '=';
    const cDecoded = decodeURIComponent(document.cookie);
    const cArr = cDecoded.split('; ');
    let res;
    cArr.forEach((val) => {
        if (val.indexOf(name) === 0) res = val.substring(name.length);
    });
    return res;
}

function isHtml(str) {
    var a = document.createElement('div');
    a.innerHTML = str;
    for (var c = a.childNodes, i = c.length; i--; ) {
        if (c[i].nodeType == 1) return true;
    }
    return false;
}

// ####################################################
// HANDLE WHITEBOARD
// ####################################################

function toggleWhiteboard() {
    if (!wbIsOpen) rc.sound('open');
    let whiteboard = rc.getId('whiteboard');
    whiteboard.classList.toggle('show');
    whiteboard.style.top = '50%';
    whiteboard.style.left = '50%';
    wbIsOpen = wbIsOpen ? false : true;
}

function setupWhiteboard() {
    setupWhiteboardCanvas();
    setupWhiteboardCanvasSize();
    setupWhiteboardLocalListners();
}

function setupWhiteboardCanvas() {
    wbCanvas = new fabric.Canvas('wbCanvas');
    wbCanvas.freeDrawingBrush.color = '#FFFFFF';
    wbCanvas.freeDrawingBrush.width = 3;
    whiteboardIsDrawingMode(true);
}

function setupWhiteboardCanvasSize() {
    let optimalSize = [wbWidth, wbHeight];
    let scaleFactorX = window.innerWidth / optimalSize[0];
    let scaleFactorY = window.innerHeight / optimalSize[1];
    if (scaleFactorX < scaleFactorY && scaleFactorX < 1) {
        wbCanvas.setWidth(optimalSize[0] * scaleFactorX);
        wbCanvas.setHeight(optimalSize[1] * scaleFactorX);
        wbCanvas.setZoom(scaleFactorX);
        setWhiteboardSize(optimalSize[0] * scaleFactorX, optimalSize[1] * scaleFactorX);
    } else if (scaleFactorX > scaleFactorY && scaleFactorY < 1) {
        wbCanvas.setWidth(optimalSize[0] * scaleFactorY);
        wbCanvas.setHeight(optimalSize[1] * scaleFactorY);
        wbCanvas.setZoom(scaleFactorY);
        setWhiteboardSize(optimalSize[0] * scaleFactorY, optimalSize[1] * scaleFactorY);
    } else {
        wbCanvas.setWidth(optimalSize[0]);
        wbCanvas.setHeight(optimalSize[1]);
        wbCanvas.setZoom(1);
        setWhiteboardSize(optimalSize[0], optimalSize[1]);
    }
    wbCanvas.calcOffset();
    wbCanvas.renderAll();
}

function setWhiteboardSize(w, h) {
    document.documentElement.style.setProperty('--wb-width', w);
    document.documentElement.style.setProperty('--wb-height', h);
}

function setWhiteboardBgColor(color) {
    let data = {
        peer_name: peer_name,
        action: 'bgcolor',
        color: color,
    };
    whiteboardAction(data);
}

function whiteboardIsDrawingMode(status) {
    wbCanvas.isDrawingMode = status;
    if (status) {
        setColor(whiteboardPencilBtn, 'green');
        setColor(whiteboardObjectBtn, 'white');
        setColor(whiteboardEraserBtn, 'white');
        wbIsEraser = false;
    } else {
        setColor(whiteboardPencilBtn, 'white');
        setColor(whiteboardObjectBtn, 'green');
    }
}

function whiteboardIsEraser(status) {
    whiteboardIsDrawingMode(false);
    wbIsEraser = status;
    setColor(whiteboardEraserBtn, wbIsEraser ? 'green' : 'white');
}

function whiteboardAddObj(type) {
    switch (type) {
        case 'imgUrl':
            Swal.fire({
                background: swalBackground,
                title: 'Image URL',
                input: 'text',
                showCancelButton: true,
                confirmButtonText: 'OK',
                showClass: { popup: 'animate__animated animate__fadeInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' },
            }).then((result) => {
                if (result.isConfirmed) {
                    let wbCanvasImgURL = result.value;
                    if (isImageURL(wbCanvasImgURL)) {
                        fabric.Image.fromURL(wbCanvasImgURL, function (myImg) {
                            addWbCanvasObj(myImg);
                        });
                    } else {
                        userLog('error', 'The URL is not a valid image', 'top-end');
                    }
                }
            });
            break;
        case 'imgFile':
            Swal.fire({
                allowOutsideClick: false,
                background: swalBackground,
                position: 'center',
                title: 'Select the image',
                input: 'file',
                inputAttributes: {
                    accept: wbImageInput,
                    'aria-label': 'Select the image',
                },
                showDenyButton: true,
                confirmButtonText: `OK`,
                denyButtonText: `Cancel`,
                showClass: { popup: 'animate__animated animate__fadeInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' },
            }).then((result) => {
                if (result.isConfirmed) {
                    let wbCanvasImg = result.value;
                    if (wbCanvasImg && wbCanvasImg.size > 0) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            let imgObj = new Image();
                            imgObj.src = event.target.result;
                            imgObj.onload = function () {
                                let image = new fabric.Image(imgObj);
                                image.set({ top: 0, left: 0 }).scale(0.3);
                                addWbCanvasObj(image);
                            };
                        };
                        reader.readAsDataURL(wbCanvasImg);
                    } else {
                        userLog('error', 'File not selected or empty', 'top-end');
                    }
                }
            });
            break;
        case 'pdfFile':
            Swal.fire({
                allowOutsideClick: false,
                background: swalBackground,
                position: 'center',
                title: 'Select the PDF',
                input: 'file',
                inputAttributes: {
                    accept: wbPdfInput,
                    'aria-label': 'Select the PDF',
                },
                showDenyButton: true,
                confirmButtonText: `OK`,
                denyButtonText: `Cancel`,
                showClass: { popup: 'animate__animated animate__fadeInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' },
            }).then((result) => {
                if (result.isConfirmed) {
                    let wbCanvasPdf = result.value;
                    if (wbCanvasPdf && wbCanvasPdf.size > 0) {
                        let reader = new FileReader();
                        reader.onload = async function (event) {
                            wbCanvas.requestRenderAll();
                            await pdfToImage(event.target.result, wbCanvas);
                            whiteboardIsDrawingMode(false);
                            wbCanvasToJson();
                        };
                        reader.readAsDataURL(wbCanvasPdf);
                    } else {
                        userLog('error', 'File not selected or empty', 'top-end');
                    }
                }
            });
            break;
        case 'text':
            const text = new fabric.IText('Lorem Ipsum', {
                top: 0,
                left: 0,
                fontFamily: 'Comfortaa',
                fill: wbCanvas.freeDrawingBrush.color,
                strokeWidth: wbCanvas.freeDrawingBrush.width,
                stroke: wbCanvas.freeDrawingBrush.color,
            });
            addWbCanvasObj(text);
            break;
        case 'line':
            const line = new fabric.Line([50, 100, 200, 200], {
                top: 0,
                left: 0,
                fill: wbCanvas.freeDrawingBrush.color,
                strokeWidth: wbCanvas.freeDrawingBrush.width,
                stroke: wbCanvas.freeDrawingBrush.color,
            });
            addWbCanvasObj(line);
            break;
        case 'circle':
            const circle = new fabric.Circle({
                radius: 50,
                fill: 'transparent',
                stroke: wbCanvas.freeDrawingBrush.color,
                strokeWidth: wbCanvas.freeDrawingBrush.width,
            });
            addWbCanvasObj(circle);
            break;
        case 'rect':
            const rect = new fabric.Rect({
                top: 0,
                left: 0,
                width: 150,
                height: 100,
                fill: 'transparent',
                stroke: wbCanvas.freeDrawingBrush.color,
                strokeWidth: wbCanvas.freeDrawingBrush.width,
            });
            addWbCanvasObj(rect);
            break;
        case 'triangle':
            const triangle = new fabric.Triangle({
                top: 0,
                left: 0,
                width: 150,
                height: 100,
                fill: 'transparent',
                stroke: wbCanvas.freeDrawingBrush.color,
                strokeWidth: wbCanvas.freeDrawingBrush.width,
            });
            addWbCanvasObj(triangle);
            break;
        default:
            break;
    }
}

function readBlob(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result));
        reader.addEventListener('error', reject);
        reader.readAsDataURL(blob);
    });
}

async function loadPDF(pdfData, pages) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfData = pdfData instanceof Blob ? await readBlob(pdfData) : pdfData;
    const data = atob(pdfData.startsWith(Base64Prefix) ? pdfData.substring(Base64Prefix.length) : pdfData);
    try {
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const numPages = pdf.numPages;
        const canvases = await Promise.all(
            Array.from({ length: numPages }, (_, i) => {
                const pageNumber = i + 1;
                if (pages && pages.indexOf(pageNumber) === -1) return null;
                return pdf.getPage(pageNumber).then(async (page) => {
                    const viewport = page.getViewport({ scale: window.devicePixelRatio });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };
                    await page.render(renderContext).promise;
                    return canvas;
                });
            }),
        );
        return canvases.filter((canvas) => canvas !== null);
    } catch (error) {
        console.error('Error loading PDF:', error);
        throw error;
    }
}

async function pdfToImage(pdfData, canvas) {
    const scale = 1 / window.devicePixelRatio;
    try {
        const canvases = await loadPDF(pdfData);
        canvases.forEach(async (c) => {
            canvas.add(
                new fabric.Image(await c, {
                    scaleX: scale,
                    scaleY: scale,
                }),
            );
        });
    } catch (error) {
        console.error('Error converting PDF to images:', error);
        throw error;
    }
}

function addWbCanvasObj(obj) {
    if (obj) {
        wbCanvas.add(obj).setActiveObject(obj);
        whiteboardIsDrawingMode(false);
        wbCanvasToJson();
    } else {
        console.error('Invalid input. Expected an obj of canvas elements');
    }
}

function setupWhiteboardLocalListners() {
    wbCanvas.on('mouse:down', function (e) {
        mouseDown(e);
    });
    wbCanvas.on('mouse:up', function () {
        mouseUp();
    });
    wbCanvas.on('mouse:move', function () {
        mouseMove();
    });
    wbCanvas.on('object:added', function () {
        objectAdded();
    });
}

function mouseDown(e) {
    wbIsDrawing = true;
    if (wbIsEraser && e.target) {
        wbCanvas.remove(e.target);
        return;
    }
}

function mouseUp() {
    wbIsDrawing = false;
    wbCanvasToJson();
}

function mouseMove() {
    if (wbIsEraser) {
        wbCanvas.hoverCursor = 'not-allowed';
        return;
    } else {
        wbCanvas.hoverCursor = 'move';
    }
    if (!wbIsDrawing) return;
}

function objectAdded() {
    if (!wbIsRedoing) wbPop = [];
    wbIsRedoing = false;
}

function wbCanvasBackgroundColor(color) {
    document.documentElement.style.setProperty('--wb-bg', color);
    wbBackgroundColorEl.value = color;
    wbCanvas.setBackgroundColor(color);
    wbCanvas.renderAll();
}

function wbCanvasUndo() {
    if (wbCanvas._objects.length > 0) {
        wbPop.push(wbCanvas._objects.pop());
        wbCanvas.renderAll();
    }
}

function wbCanvasRedo() {
    if (wbPop.length > 0) {
        wbIsRedoing = true;
        wbCanvas.add(wbPop.pop());
    }
}

function wbCanvasSaveImg() {
    const dataURL = wbCanvas.toDataURL({
        width: wbCanvas.getWidth(),
        height: wbCanvas.getHeight(),
        left: 0,
        top: 0,
        format: 'png',
    });
    const dataNow = getDataTimeString();
    const fileName = `whiteboard-${dataNow}.png`;
    saveDataToFile(dataURL, fileName);
}

function wbUpdate() {
    if (wbIsOpen && (!isRulesActive || isPresenter)) {
        console.log('IsPresenter: update whiteboard canvas to the participants in the room');
        wbCanvasToJson();
        whiteboardAction(getWhiteboardAction(wbIsLock ? 'lock' : 'unlock'));
    }
}

function wbCanvasToJson() {
    if (!isPresenter && wbIsLock) return;
    if (rc.thereAreParticipants()) {
        let wbCanvasJson = JSON.stringify(wbCanvas.toJSON());
        rc.socket.emit('wbCanvasToJson', wbCanvasJson);
    }
}

function JsonToWbCanvas(json) {
    if (!wbIsOpen) toggleWhiteboard();
    wbCanvas.loadFromJSON(json);
    wbCanvas.renderAll();
    if (!isPresenter && !wbCanvas.isDrawingMode && wbIsLock) {
        wbDrawing(false);
    }
}

function getWhiteboardAction(action) {
    return {
        peer_name: peer_name,
        action: action,
    };
}

function confirmClearBoard() {
    Swal.fire({
        background: swalBackground,
        imageUrl: image.delete,
        position: 'center',
        title: 'Clean the board',
        text: 'Are you sure you want to clean the board?',
        showDenyButton: true,
        confirmButtonText: `Yes`,
        denyButtonText: `No`,
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
    }).then((result) => {
        if (result.isConfirmed) {
            whiteboardAction(getWhiteboardAction('clear'));
            sound('delete');
        }
    });
}

function whiteboardAction(data, emit = true) {
    if (emit) {
        if (rc.thereAreParticipants()) {
            rc.socket.emit('whiteboardAction', data);
        }
    } else {
        userLog(
            'info',
            `${data.peer_name} <i class="fas fa-chalkboard-teacher"></i> whiteboard action: ${data.action}`,
            'top-end',
        );
    }

    switch (data.action) {
        case 'bgcolor':
            wbCanvasBackgroundColor(data.color);
            break;
        case 'undo':
            wbCanvasUndo();
            break;
        case 'redo':
            wbCanvasRedo();
            break;
        case 'clear':
            wbCanvas.clear();
            break;
        case 'lock':
            if (!isPresenter) {
                elemDisplay('whiteboardTitle', false);
                elemDisplay('whiteboardOptions', false);
                elemDisplay('whiteboardButton', false);
                wbDrawing(false);
                wbIsLock = true;
            }
            break;
        case 'unlock':
            if (!isPresenter) {
                elemDisplay('whiteboardTitle', true, 'flex');
                elemDisplay('whiteboardOptions', true, 'inline');
                elemDisplay('whiteboardButton', true);
                wbDrawing(true);
                wbIsLock = false;
            }
            break;
        case 'close':
            if (wbIsOpen) toggleWhiteboard();
            break;
        default:
            break;
        //...
    }
}

function wbDrawing(status) {
    wbCanvas.isDrawingMode = status; // Disable free drawing
    wbCanvas.selection = status; // Disable object selection
    wbCanvas.forEachObject(function (obj) {
        obj.selectable = status; // Make all objects unselectable
    });
}

// ####################################################
// HANDLE PARTICIPANTS
// ####################################################

async function getRoomPeers() {
    let room_info = await rc.getRoomInfo();
    return new Map(JSON.parse(room_info.peers));
}

async function saveRoomPeers() {
    const peers = await getRoomPeers();
    let peersToSave = [];
    for (let peer of Array.from(peers.keys())) {
        peersToSave.push(peers.get(peer).peer_info);
    }
    saveObjToJsonFile(peersToSave, 'PARTICIPANTS');
}

async function getRoomParticipants() {
    const peers = await getRoomPeers();
    const lists = await getParticipantsList(peers);
    participantsCount = peers.size;
    participantsList.innerHTML = lists;
    refreshParticipantsCount(participantsCount, false);
    setParticipantsTippy(peers);
}

async function getParticipantsList(peers) {
    // CHAT-GPT
    let li = `
    <li 
        id="ChatGPT" 
        data-to-id="ChatGPT"
        data-to-name="ChatGPT"
        class="clearfix" 
        onclick="rc.showPeerAboutAndMessages(this.id, 'ChatGPT', event)"
    >
        <img 
            src="${image.chatgpt}"
            alt="avatar"
        />
        <div class="about">
            <div class="name">ChatGPT</div>
            <div class="status"><i class="fa fa-circle online"></i> online</div>
        </div>
    </li>
    `;

    // ALL
    li += `
    <li id="all"
        data-to-id="all"
        data-to-name="all"
        class="clearfix active" 
        onclick="rc.showPeerAboutAndMessages(this.id, 'all', event)"
    >
        <img 
            src="${image.all}"
            alt="avatar"
        />
        <div class="about">
            <div class="name">Herkese açık sohbet</div>
            <div class="status"> <i class="fa fa-circle online"></i> online ${participantsCount}</div>
        </div>`;

    // ONLY PRESENTER CAN EXECUTE THIS CMD
    if (!isRulesActive || isPresenter) {
        li += `
        <div style="class="dropdown">
            <button 
                class="dropdown-toggle" 
                type="button" 
                id="${socket.id}-chatDropDownMenu" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
            >
            <!-- <i class="fas fa-bars"></i> -->
            </button>
            <ul class="dropdown-menu" aria-labelledby="${socket.id}-chatDropDownMenu">
                <li><button class="btn-sm ml5" id="sendAllButton" onclick="rc.selectFileToShare('${socket.id}', true)">${_PEER.sendFile} Share file to all</button></li>
                <li><button class="btn-sm ml5" id="sendVideoToAll" onclick="rc.shareVideo('all');">${_PEER.sendVideo} Share audio/video to all</button></li>
                <li><button class="btn-sm ml5" id="ejectAllButton" onclick="rc.peerAction('me','${socket.id}','eject',true,true)">${_PEER.ejectPeer} Eject all participants</button></li>
            </ul>
        </div>

        <br/>

        <div class="about-buttons mt5">
            <button class="ml5" id="muteAllButton" onclick="rc.peerAction('me','${socket.id}','mute',true,true)">${_PEER.audioOff}</button>
            <button class="ml5" id="hideAllButton" onclick="rc.peerAction('me','${socket.id}','hide',true,true)">${_PEER.videoOff}</button>
            <button class="ml5" id="stopAllButton" onclick="rc.peerAction('me','${socket.id}','stop',true,true)">${_PEER.screenOff}</button>
        </div>`;
    }

    li += `
    </li>
    `;

    // PEERS IN THE CURRENT ROOM
    for (const peer of Array.from(peers.keys())) {
        const peer_info = peers.get(peer).peer_info;
        const peer_name = peer_info.peer_name;
        const peer_audio = peer_info.peer_audio ? _PEER.audioOn : _PEER.audioOff;
        const peer_video = peer_info.peer_video ? _PEER.videoOn : _PEER.videoOff;
        const peer_screen = peer_info.peer_screen ? _PEER.screenOn : _PEER.screenOff;
        const peer_hand = peer_info.peer_hand ? _PEER.raiseHand : _PEER.lowerHand;
        const peer_eject = _PEER.ejectPeer;
        const peer_sendFile = _PEER.sendFile;
        const peer_id = peer_info.peer_id;
        const avatarImg = getParticipantAvatar(peer_name);

        // NOT ME
        if (socket.id !== peer_id) {
            // PRESENTER HAS MORE OPTIONS
            if (isRulesActive && isPresenter) {
                li += `
                <li 
                    id='${peer_id}'
                    data-to-id="${peer_id}" 
                    data-to-name="${peer_name}"
                    class="clearfix" 
                    onclick="rc.showPeerAboutAndMessages(this.id, '${peer_name}', event)"
                >
                    <img
                        src="${avatarImg}"
                        alt="avatar" 
                    />
                    <div class="about">
                        <div class="name">${peer_name}</div>
                        <div class="status"> <i class="fa fa-circle online"></i> online <i id="${peer_id}-unread-msg" class="fas fa-comments hidden"></i> </div>
                    </div>

                    <div style="class="dropdown">
                        <button 
                            class="dropdown-toggle" 
                            type="button" 
                            id="${peer_id}-chatDropDownMenu" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                        >
                        <!-- <i class="fas fa-bars"></i> -->
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="${peer_id}-chatDropDownMenu">
                            <li><button class="btn-sm ml5" id='${peer_id}___shareFile' onclick="rc.selectFileToShare('${peer_id}', false)">${peer_sendFile} Share file</button></li>
                            <li><button class="btn-sm ml5" id="${peer_id}___sendVideoTo" onclick="rc.shareVideo('${peer_id}');">${_PEER.sendVideo} Share audio/video</button></li>
                            <li><button class="btn-sm ml5" id='${peer_id}___pEject' onclick="rc.peerAction('me',this.id,'eject')">${peer_eject} Eject participant</button></li>
                        </ul>
                    </div>

                    <br/>

                    <div class="about-buttons mt5"> 
                        <button class="ml5" id='${peer_id}___pAudio' onclick="rc.peerAction('me',this.id,'mute')">${peer_audio}</button>
                        <button class="ml5" id='${peer_id}___pVideo' onclick="rc.peerAction('me',this.id,'hide')">${peer_video}</button>
                        <button class="ml5" id='${peer_id}___pScreen' onclick="rc.peerAction('me',this.id,'stop')">${peer_screen}</button>
                `;

                if (peer_info.peer_hand) {
                    li += `
                        <button class="ml5" >${peer_hand}</button>`;
                }

                li += ` 
                    </div>
                </li>
                `;
            } else {
                // GUEST USER
                li += `
                <li 
                    id='${peer_id}' 
                    data-to-id="${peer_id}"
                    data-to-name="${peer_name}"
                    class="clearfix" 
                    onclick="rc.showPeerAboutAndMessages(this.id, '${peer_name}', event)"
                >
                <img 
                    src="${avatarImg}"
                    alt="avatar" 
                />
                    <div class="about">
                        <div class="name">${peer_name}</div>
                        <div class="status"> <i class="fa fa-circle online"></i> online <i id="${peer_id}-unread-msg" class="fas fa-comments hidden"></i> </div>
                    </div>

                    <div style="class="dropdown">
                        <button 
                            class="dropdown-toggle" 
                            type="button" 
                            id="${peer_id}-chatDropDownMenu" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                        >
                        <!-- <i class="fas fa-bars"></i> -->
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="${peer_id}-chatDropDownMenu">
                            <li><button class="btn-sm ml5" id='${peer_id}___shareFile' onclick="rc.selectFileToShare('${peer_id}', false)">${peer_sendFile} Share file</button></li>
                            <li><button class="btn-sm ml5" id="${peer_id}___sendVideoTo" onclick="rc.shareVideo('${peer_id}');">${_PEER.sendVideo} Share Audio/Video</button></li>
                        </ul>
                    </div>

                    <br/>

                    <div class="about-buttons mt5"> 
                        <button class="ml5" id='${peer_id}___pAudio'>${peer_audio}</button>
                        <button class="ml5" id='${peer_id}___pVideo'>${peer_video}</button>
                        <button class="ml5" id='${peer_id}___pScreen'>${peer_screen}</button>
                        `;
                if (peer_info.peer_hand) {
                    li += ` 
                        <button class="ml5" >${peer_hand}</button>`;
                }
                li += ` 
                    </div>
                </li>
                `;
            }
        }
    }
    return li;
}

function setParticipantsTippy(peers) {
    //
    if (!DetectRTC.isMobileDevice) {
        setTippy('muteAllButton', 'Tüm katılımcıların sesini kapat', 'top');
        setTippy('hideAllButton', 'Tüm katılımcıları gizle', 'top');
        setTippy('stopAllButton', 'Tüm katılımcılarla ekran paylaşımını durdurun', 'top');
        //
        for (let peer of Array.from(peers.keys())) {
            const peer_info = peers.get(peer).peer_info;
            const peer_id = peer_info.peer_id;
            setTippy(peer_id + '___pAudio', 'Sesi Kıs', 'top');
            setTippy(peer_id + '___pVideo', 'Gizle', 'top');
            setTippy(peer_id + '___pScreen', 'Durdur', 'top');
        }
    }
}

function refreshParticipantsCount(count, adapt = true) {
    if (adapt) adaptAspectRatio(count);
}

function getParticipantAvatar(peerName) {
    return rc.genAvatarSvg(peerName, 32);
}

// ####################################################
// SET THEME
// ####################################################

function setTheme() {
    selectTheme.selectedIndex = lsSettings.theme;
    const theme = selectTheme.value;
    switch (theme) {
        case 'dark':
            swalBackground = 'radial-gradient(#393939, #000000)';
            document.documentElement.style.setProperty('--body-bg', 'radial-gradient(#393939, #000000)');
            document.documentElement.style.setProperty('--transcription-bg', 'radial-gradient(#393939, #000000)');
            document.documentElement.style.setProperty('--msger-bg', 'radial-gradient(#393939, #000000)');
            document.documentElement.style.setProperty('--left-msg-bg', '#056162');
            document.documentElement.style.setProperty('--right-msg-bg', '#252d31');
            document.documentElement.style.setProperty('--select-bg', '#2c2c2c');
            document.documentElement.style.setProperty('--tab-btn-active', '#393939');
            document.documentElement.style.setProperty('--settings-bg', 'radial-gradient(#393939, #000000)');
            document.documentElement.style.setProperty('--wb-bg', 'radial-gradient(#393939, #000000)');
            document.documentElement.style.setProperty('--btns-bg-color', 'rgba(0, 0, 0, 0.7)');
            document.body.style.background = 'radial-gradient(#393939, #000000)';
            selectTheme.selectedIndex = 0;
            break;
        case 'grey':
            swalBackground = 'radial-gradient(#666, #333)';
            document.documentElement.style.setProperty('--body-bg', 'radial-gradient(#666, #333)');
            document.documentElement.style.setProperty('--transcription-bg', 'radial-gradient(#666, #333)');
            document.documentElement.style.setProperty('--msger-bg', 'radial-gradient(#666, #333)');
            document.documentElement.style.setProperty('--left-msg-bg', '#056162');
            document.documentElement.style.setProperty('--right-msg-bg', '#252d31');
            document.documentElement.style.setProperty('--select-bg', '#2c2c2c');
            document.documentElement.style.setProperty('--tab-btn-active', '#666');
            document.documentElement.style.setProperty('--settings-bg', 'radial-gradient(#666, #333)');
            document.documentElement.style.setProperty('--wb-bg', 'radial-gradient(#797979, #000)');
            document.documentElement.style.setProperty('--btns-bg-color', 'rgba(0, 0, 0, 0.7)');
            document.body.style.background = 'radial-gradient(#666, #333)';
            selectTheme.selectedIndex = 1;
            break;
        case 'green':
            swalBackground = 'radial-gradient(#003934, #001E1A)';
            document.documentElement.style.setProperty('--body-bg', 'radial-gradient(#003934, #001E1A)');
            document.documentElement.style.setProperty('--transcription-bg', 'radial-gradient(#003934, #001E1A)');
            document.documentElement.style.setProperty('--msger-bg', 'radial-gradient(#003934, #001E1A)');
            document.documentElement.style.setProperty('--left-msg-bg', '#001E1A');
            document.documentElement.style.setProperty('--right-msg-bg', '#003934');
            document.documentElement.style.setProperty('--select-bg', '#001E1A');
            document.documentElement.style.setProperty('--tab-btn-active', '#003934');
            document.documentElement.style.setProperty('--settings-bg', 'radial-gradient(#003934, #001E1A)');
            document.documentElement.style.setProperty('--wb-bg', 'radial-gradient(#003934, #001E1A)');
            document.documentElement.style.setProperty('--btns-bg-color', 'radial-gradient(#003934, #001E1A)');
            document.body.style.background = 'radial-gradient(#003934, #001E1A)';
            selectTheme.selectedIndex = 2;
            break;
        case 'blue':
            swalBackground = 'radial-gradient(#306bac, #141B41)';
            document.documentElement.style.setProperty('--body-bg', 'radial-gradient(#306bac, #141B41)');
            document.documentElement.style.setProperty('--transcription-bg', 'radial-gradient(#306bac, #141B41)');
            document.documentElement.style.setProperty('--msger-bg', 'radial-gradient(#306bac, #141B41)');
            document.documentElement.style.setProperty('--left-msg-bg', '#141B41');
            document.documentElement.style.setProperty('--right-msg-bg', '#306bac');
            document.documentElement.style.setProperty('--select-bg', '#141B41');
            document.documentElement.style.setProperty('--tab-btn-active', '#306bac');
            document.documentElement.style.setProperty('--settings-bg', 'radial-gradient(#306bac, #141B41)');
            document.documentElement.style.setProperty('--wb-bg', 'radial-gradient(#306bac, #141B41)');
            document.documentElement.style.setProperty('--btns-bg-color', 'radial-gradient(#141B41, #306bac)');
            document.body.style.background = 'radial-gradient(#306bac, #141B41)';
            selectTheme.selectedIndex = 3;
            break;
        case 'red':
            swalBackground = 'radial-gradient(#69140E, #3C1518)';
            document.documentElement.style.setProperty('--body-bg', 'radial-gradient(#69140E, #3C1518)');
            document.documentElement.style.setProperty('--transcription-bg', 'radial-gradient(#69140E, #3C1518)');
            document.documentElement.style.setProperty('--msger-bg', 'radial-gradient(#69140E, #3C1518)');
            document.documentElement.style.setProperty('--left-msg-bg', '#3C1518');
            document.documentElement.style.setProperty('--right-msg-bg', '#69140E');
            document.documentElement.style.setProperty('--select-bg', '#3C1518');
            document.documentElement.style.setProperty('--tab-btn-active', '#69140E');
            document.documentElement.style.setProperty('--settings-bg', 'radial-gradient(#69140E, #3C1518)');
            document.documentElement.style.setProperty('--wb-bg', 'radial-gradient(#69140E, #3C1518)');
            document.documentElement.style.setProperty('--btns-bg-color', 'radial-gradient(#69140E, #3C1518)');
            document.body.style.background = 'radial-gradient(#69140E, #3C1518)';
            selectTheme.selectedIndex = 4;
            break;
        default:
            break;
        //...
    }
    wbIsBgTransparent = false;
    if (rc) rc.isChatBgTransparent = false;
}

// ####################################################
// HANDLE ASPECT RATIO
// ####################################################

function handleAspectRatio() {
    if (participantsCount > 1) {
        adaptAspectRatio(videoMediaContainer.childElementCount);
    } else {
        resizeVideoMedia();
    }
}

function adaptAspectRatio(participantsCount) {
    /* 
        ['0:0', '4:3', '16:9', '1:1', '1:2'];
    */
    let desktop,
        mobile = 1;
    // desktop aspect ratio
    switch (participantsCount) {
        case 1:
        case 3:
        case 4:
        case 7:
        case 9:
            desktop = 2; // (16:9)
            break;
        case 5:
        case 6:
        case 10:
        case 11:
            desktop = 1; // (4:3)
            break;
        case 2:
        case 8:
            desktop = 3; // (1:1)
            break;
        default:
            desktop = 0; // (0:0)
    }
    // mobile aspect ratio
    switch (participantsCount) {
        case 3:
        case 9:
        case 10:
            mobile = 2; // (16:9)
            break;
        case 2:
        case 7:
        case 8:
        case 11:
            mobile = 1; // (4:3)
            break;
        case 1:
        case 4:
        case 5:
        case 6:
            mobile = 3; // (1:1)
            break;
        default:
            mobile = 3; // (1:1)
    }
    if (participantsCount > 11) {
        desktop = 1; // (4:3)
        mobile = 3; // (1:1)
    }
    BtnAspectRatio.selectedIndex = DetectRTC.isMobileDevice ? mobile : desktop;
    setAspectRatio(BtnAspectRatio.selectedIndex);
}

// ####################################################
// ABOUT
// ####################################################

function showAbout() {
    sound('open');

    Swal.fire({
        background: swalBackground,
        imageUrl: image.about,
        customClass: { image: 'img-about' },
        position: 'center',
        title: 'WebRTC SFU',
        html: `
        <br/>
        <div id="about">
            <button 
                id="support-button" 
                data-umami-event="Support button" 
                class="pulsate" 
                onclick="window.open('https://codecanyon.net/user/miroslavpejic85')">
                <i class="fas fa-heart"></i> 
                Support
            </button>
            <br /><br />
            Author: <a 
                id="linkedin-button" 
                data-umami-event="Linkedin button" 
                href="https://www.linkedin.com/in/miroslav-pejic-976a07101/" target="_blank"> 
                Miroslav Pejic
            </a>
            <br /><br />
            Email:<a 
                id="email-button" 
                data-umami-event="Email button" 
                href="mailto:miroslav.pejic.85@gmail.com?subject=Elit Live SFU info"> 
                miroslav.pejic.85@gmail.com
            </a>
        </div>
        `,
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
    });
}
