(function () {
    "use strict";

    // 간단한 BotMan Widget 클래스
    class SimpleBotWidget {
        constructor(options = {}) {
            this.options = {
                container: options.container || "body",
                apiUrl: options.apiUrl || "../chat/com_chat.php",
                title: options.title || "챗봇",
                placeholder: options.placeholder || "메시지를 입력하세요.",
                autoStart: options.autoStart || false,
                primaryColor: options.primaryColor || "#007bff",
                readOnly: options.readOnly || false, // 추가: 읽기 전용 모드
                initialData: options.initialData || null, // 추가: 초기 데이터
            };

            this.userId = this.generateUserId();

            if (this.options.autoStart) {
                loadBotCSS();
                setTimeout(() => {
                    this.init();
                }, 1);
            }

            // 읽기 전용 모드가 아닐 때만 메시지 리스너 등록
            if (!this.options.readOnly) {
                window.addEventListener("message", (event) => {
                    // 보안 위해 origin 체크
                    if (
                        event.origin !== "http://www.dev.coz" &&
                        event.origin !== "https://www3.compuzone.co.kr" &&
                        event.origin !== "https://www.compuzone.co.kr" &&
                        event.origin !== "https://cozmanager5.compuzone.co.kr"
                    )
                        return;

                    if (event.data && event.data.type === "botman-message") {
                        if (event.data.hidden === true) {
                            this.sendMessage(
                                event.data.message,
                                true,
                                "iframe_hidden"
                            );
                        } else {
                            this.sendMessage(
                                event.data.message,
                                false,
                                "iframe"
                            );
                        }
                    }
                });
            }
        }

        async init() {
            this.createWidget();
            // 읽기 전용 모드가 아닐 때만 이벤트 바인딩
            if (!this.options.readOnly) {
                this.bindEvents();
            }

            // 초기 데이터가 있으면 표시, 없으면 기존 로직 실행
            if (this.options.initialData) {
                this.displayInitialData();
            } else if (!this.options.readOnly) {
                // 이전 대화내용 로드 추가
                const hasHistory = await this.loadChatHistory();

                if (this.options.autoStart && !hasHistory) {
                    setTimeout(
                        () => this.sendMessage("시작", true, "auto_start"),
                        500
                    );
                }
            }
        }

        async getUserId() {
            try {
                const formData = new FormData();
                formData.append("driver", "web");
                formData.append("action", "get_userid"); // 히스토리 로드 액션
                formData.append("user", this.userId);

                const response = await fetch(this.options.apiUrl, {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();
                if (data.userid) {
                    return data.userid;
                } else {
                    return false;
                }
            } catch (error) {
                console.log("이전 대화내용 로드 실패:", error);
                return false;
                // 에러가 발생해도 채팅봇은 정상 동작하도록 함
            }
        }

        // 이전 대화내용을 로드 메서드
        async loadChatHistory() {
            try {
                const formData = new FormData();
                const getIdData = await this.getUserId();

                formData.append("driver", "web");
                formData.append("userId", getIdData);
                formData.append("action", "load_history"); // 히스토리 로드 액션
                formData.append("user", this.userId);

                const response = await fetch(this.options.apiUrl, {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();
                if (data.history && data.history.length > 0) {
                    // 기존 대화내용을 순서대로 표시
                    data.history.forEach((historyItem) => {
                        if (
                            historyItem.type === "user" &&
                            historyItem.message !== "시작" &&
                            historyItem.message !== "처음으로" &&
                            historyItem.message !== "show_menu" &&
                            historyItem.message !== "login" &&
                            historyItem.message.indexOf("all-") == -1 &&
                            historyItem.message.indexOf("bas-") == -1
                        ) {
                            this.addMessage(
                                historyItem.message,
                                "user",
                                "",
                                "",
                                "",
                                "history"
                            );
                        } else if (historyItem.type === "bot") {
                            // 봇 메시지의 경우 buttons나 기타 속성도 함께 처리
                            // 일반 문자열
                            if (historyItem.message.type === "text") {
                                const isHtml =
                                    historyItem.message.html === true;
                                const url = historyItem.message.url || null;
                                const buttons =
                                    historyItem.message.buttons || null;

                                if (
                                    historyItem?.message?.text &&
                                    !historyItem.message.text2
                                ) {
                                    this.addMessage(
                                        historyItem.message.text,
                                        "bot",
                                        buttons,
                                        isHtml,
                                        url,
                                        "history"
                                    );
                                } else if (historyItem?.message?.text2) {
                                    this.addMessage(
                                        historyItem.message.text2,
                                        "bot",
                                        buttons,
                                        isHtml,
                                        url,
                                        "history"
                                    );
                                }
                            } else if (historyItem.message.type === "textarr") {
                                const isHtml =
                                    historyItem.message.html === true;
                                const url = historyItem.message.url || null;
                                const buttons =
                                    historyItem.message.buttons || null;

                                if (historyItem?.message?.text) {
                                    if (
                                        Array.isArray(
                                            historyItem.message.text
                                        ) &&
                                        historyItem.message.text.length > 0
                                    ) {
                                        historyItem.message.text.forEach(
                                            (msg2) => {
                                                // 일반 메시지 처리
                                                this.addMessage(
                                                    msg2,
                                                    "bot",
                                                    buttons,
                                                    isHtml,
                                                    url,
                                                    "history"
                                                );
                                            }
                                        );
                                    }
                                }
                            } else if (
                                historyItem.message.type === "producthtml" ||
                                historyItem.message.type === "html"
                            ) {
                                // html포함
                                const isHtml = true;
                                const url = historyItem.message.url || null;
                                const buttons =
                                    historyItem.message.buttons || null;

                                if (historyItem?.message?.text?.text) {
                                    if (
                                        Array.isArray(
                                            historyItem.message.text.text
                                        ) &&
                                        historyItem.message.text.text.length > 1
                                    ) {
                                        // html이랑 메세지 동시 + 메세지 배열일 경우
                                        historyItem.message.text.text.forEach(
                                            (msg2) => {
                                                // 일반 메시지 처리
                                                const isHtml =
                                                    msg2.html === true;
                                                const url = msg2.url || null;
                                                this.addMessage(
                                                    msg2,
                                                    "bot",
                                                    msg2.buttons,
                                                    isHtml,
                                                    url,
                                                    "history"
                                                );
                                            }
                                        );
                                    } else {
                                        this.addMessage(
                                            historyItem.message.text.text,
                                            "bot",
                                            null,
                                            isHtml,
                                            url,
                                            "history"
                                        );
                                    }
                                } else if (historyItem?.message?.text2) {
                                    this.addMessage(
                                        historyItem.message.text2,
                                        "bot",
                                        null,
                                        isHtml,
                                        url,
                                        "history"
                                    );
                                }

                                this.addMessage(
                                    historyItem.message.html,
                                    "bot",
                                    buttons,
                                    isHtml,
                                    url,
                                    "history"
                                );
                            } else if (historyItem.message.type === "iframe") {
                                // iframe연결
                                this.addIframeMessage(
                                    historyItem.message.url,
                                    historyItem.message.height,
                                    historyItem.message.buttons
                                );
                            } else {
                                historyItem.message.forEach(
                                    (productHtmlVer2) => {
                                        if (
                                            productHtmlVer2.type === "html_ver2"
                                        ) {
                                            const isHtml = true;
                                            const url =
                                                productHtmlVer2.url || null;
                                            const buttons =
                                                productHtmlVer2.buttons || null;
                                            if (
                                                Array.isArray(
                                                    productHtmlVer2.text.text
                                                ) &&
                                                productHtmlVer2.text.text
                                                    .length > 1
                                            ) {
                                                productHtmlVer2.text.text.forEach(
                                                    (msg2) => {
                                                        // 일반 메시지 처리
                                                        const isHtml =
                                                            msg2.html === true;
                                                        const url =
                                                            msg2.url || null;
                                                        this.addMessage(
                                                            msg2,
                                                            "bot",
                                                            msg2.buttons,
                                                            isHtml,
                                                            url,
                                                            "history"
                                                        );
                                                    }
                                                );
                                            } else {
                                                if (productHtmlVer2.text.text) {
                                                    this.addMessage(
                                                        productHtmlVer2.text
                                                            .text,
                                                        "bot",
                                                        null,
                                                        isHtml,
                                                        url,
                                                        "history"
                                                    );
                                                } else if (
                                                    productHtmlVer2.text2
                                                ) {
                                                    this.addMessage(
                                                        productHtmlVer2.text2,
                                                        "bot",
                                                        null,
                                                        isHtml,
                                                        url,
                                                        "history"
                                                    );
                                                }
                                            }

                                            this.addMessage(
                                                productHtmlVer2.html,
                                                "bot",
                                                buttons,
                                                isHtml,
                                                url,
                                                "history"
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    });
                    return true;
                }
                return false;
            } catch (error) {
                console.log("이전 대화내용 로드 실패:", error);
                return false;
                // 에러가 발생해도 채팅봇은 정상 동작하도록 함
            }
        }

        displayInitialData() {
            if (!this.options.initialData || !this.options.initialData.messages)
                return;

            this.options.initialData.messages.forEach((msg) => {
                if (
                    msg.type === "user" &&
                    msg.message !== "시작" &&
                    msg.message !== "처음으로" &&
                    msg.message !== "show_menu" &&
                    msg.message !== "login" &&
                    msg.message.indexOf("all-") == -1 &&
                    msg.message.indexOf("bas-") == -1
                ) {
                    this.addMessage(msg.message, "user", "", "", "", "history");
                } else if (msg.type === "bot") {
                    // 봇 메시지의 경우 buttons나 기타 속성도 함께 처리
                    // 일반 문자열
                    if (msg.message.type === "text") {
                        const isHtml = msg.message.html === true;
                        const url = msg.message.url || null;
                        const buttons = msg.message.buttons || null;

                        if (msg?.message?.text && !msg.message.text2) {
                            this.addMessage(
                                msg.message.text,
                                "bot",
                                buttons,
                                isHtml,
                                url,
                                "history"
                            );
                        } else if (msg?.message?.text2) {
                            this.addMessage(
                                msg.message.text2,
                                "bot",
                                buttons,
                                isHtml,
                                url,
                                "history"
                            );
                        }
                    } else if (msg.message.type === "textarr") {
                        const isHtml = msg.message.html === true;
                        const url = msg.message.url || null;
                        const buttons = msg.message.buttons || null;

                        if (msg?.message?.text) {
                            if (
                                Array.isArray(msg.message.text) &&
                                msg.message.text.length > 0
                            ) {
                                msg.message.text.forEach((msg2) => {
                                    // 일반 메시지 처리
                                    this.addMessage(
                                        msg2,
                                        "bot",
                                        buttons,
                                        isHtml,
                                        url,
                                        "history"
                                    );
                                });
                            }
                        }
                    } else if (
                        msg.message.type === "producthtml" ||
                        msg.message.type === "html"
                    ) {
                        // html포함
                        const isHtml = true;
                        const url = msg.message.url || null;
                        const buttons = msg.message.buttons || null;

                        if (msg?.message?.text?.text) {
                            if (
                                Array.isArray(msg.message.text.text) &&
                                msg.message.text.text.length > 1
                            ) {
                                // html이랑 메세지 동시 + 메세지 배열일 경우
                                msg.message.text.text.forEach((msg2) => {
                                    // 일반 메시지 처리
                                    const isHtml = msg2.html === true;
                                    const url = msg2.url || null;
                                    this.addMessage(
                                        msg2,
                                        "bot",
                                        msg2.buttons,
                                        isHtml,
                                        url,
                                        "history"
                                    );
                                });
                            } else {
                                this.addMessage(
                                    msg.message.text.text,
                                    "bot",
                                    null,
                                    isHtml,
                                    url,
                                    "history"
                                );
                            }
                        } else if (msg?.message?.text2) {
                            this.addMessage(
                                msg.message.text2,
                                "bot",
                                null,
                                isHtml,
                                url,
                                "history"
                            );
                        }

                        this.addMessage(
                            msg.message.html,
                            "bot",
                            buttons,
                            isHtml,
                            url,
                            "history"
                        );
                    } else if (msg.message.type === "iframe") {
                        // iframe연결
                        this.addIframeMessage(
                            msg.message.url,
                            msg.message.height,
                            msg.message.buttons
                        );
                    } else {
                        msg.message.forEach((productHtmlVer2) => {
                            if (productHtmlVer2.type === "html_ver2") {
                                const isHtml = true;
                                const url = productHtmlVer2.url || null;
                                const buttons = productHtmlVer2.buttons || null;
                                if (
                                    Array.isArray(productHtmlVer2.text.text) &&
                                    productHtmlVer2.text.text.length > 1
                                ) {
                                    productHtmlVer2.text.text.forEach(
                                        (msg2) => {
                                            // 일반 메시지 처리
                                            const isHtml = msg2.html === true;
                                            const url = msg2.url || null;
                                            this.addMessage(
                                                msg2,
                                                "bot",
                                                msg2.buttons,
                                                isHtml,
                                                url,
                                                "history"
                                            );
                                        }
                                    );
                                } else {
                                    if (productHtmlVer2.text.text) {
                                        this.addMessage(
                                            productHtmlVer2.text.text,
                                            "bot",
                                            null,
                                            isHtml,
                                            url,
                                            "history"
                                        );
                                    } else if (productHtmlVer2.text2) {
                                        this.addMessage(
                                            productHtmlVer2.text2,
                                            "bot",
                                            null,
                                            isHtml,
                                            url,
                                            "history"
                                        );
                                    }
                                }

                                this.addMessage(
                                    productHtmlVer2.html,
                                    "bot",
                                    buttons,
                                    isHtml,
                                    url,
                                    "history"
                                );
                            }
                        });
                    }
                }
            });
        }
        createWidget() {
            const container = document.querySelector(this.options.container);
            // 읽기 전용 모드일 때는 입력 영역 제거
            const inputAreaHtml = this.options.readOnly
                ? ""
                : `
						<div class="bot-input-area">
								<button type="button" id="bot-menu" class="menu-btn" onClick="showMenuPop();"><span class="blind">메뉴바</span></button>
								<input type="text" id="bot-input" placeholder="${this.options.placeholder}">
								<button type="button" id="bot-send" class="send-btn"><span class="blind">전송</span></button>
						</div>`;

            container.innerHTML = `
						<div class="bot-widget">
								<div class="bot-header">
										<h3>${this.options.title}</h3>
										<button type="button" class="bot-minimize" onclick="showPopupBtn();">×</button>
								</div>
								<div class="bot-messages" id="bot-messages"></div>
								${inputAreaHtml}
								<div class="bot-dimm"></div>
								<div class="quick-popup">
										<div class="quick-header">
												<h3>궁금한 문의를 선택해 주세요.</h3>
												<a href="#" class="close-btn"></a>
										</div>
										<div id="quick-menu" class="quick-cont">
												
										</div>
								</div>
								<!-- 챗봇 가이드 영역 -->
								<div class="bot-guide-wrap" style="background-color:white;"></div>
						</div>
				`;

            // 전역 함수들 등록 (읽기 전용 모드에서는 동작하지 않도록 수정)
            window.sendBotMessage = (
                message,
                show = false,
                messageType = "external"
            ) => {
                if (!this.options.readOnly) {
                    this.sendMessage(message, show, messageType);
                }
            };

            window.showMenuPop = () => {
                if (!this.options.readOnly) {
                    this.showMenu();
                }
            };

            window.showGuidePop = () => {
                if (!this.options.readOnly) {
                    this.showGuide();
                }
            };

            window.showPopupBtn = (title = "", content = "", buttons = []) => {
                const ca = document.cookie.split(";");
                if (ca.indexOf(" chat-satisfaction=Y") < 0) {
                    this.showPopup(title, content, buttons);
                } else {
                    $("#widget-container").hide();
                }
            };

            this.addSlides();
        }

        // 스타일 추가 함수 (혹시 몰라서 주석처리만)
        // addStyles() {
        // 		if (document.getElementById('bot-styles')) return;

        // 		const style = document.createElement('style');
        // 		style.id = 'bot-styles';
        // 		style.textContent = `스타일 들어가는 부분`;

        // 		document.head.appendChild(style);
        // }

        // iframe 메시지 추가 메서드
        addIframeMessage(url, height = 300, buttons = null) {
            const messagesContainer = document.getElementById("bot-messages");
            const messageDiv = document.createElement("div");
            messageDiv.className = "bot-message bot";

            // 봇 이름 추가
            const nameDiv = document.createElement("div");
            nameDiv.className = "bot-name";
            nameDiv.textContent = "컴퓨존 챗봇";
            messageDiv.appendChild(nameDiv);

            // iframe 컨테이너
            const iframeContainer = document.createElement("div");
            iframeContainer.className = "bot-iframe-container";
            iframeContainer.style.cssText = `
					width:100%;
					height: ${height}px;
					border:1px solid #ddd;
					border-radius:8px;
					overflow:hidden;
					margin:5px 0;
				`;

            // 로딩 표시
            const loadingDiv = document.createElement("div");
            loadingDiv.className = "bot-iframe-loading";
            loadingDiv.textContent = "페이지를 불러오는 중...";
            iframeContainer.appendChild(loadingDiv);

            // iframe 생성
            const iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.style.cssText = `
					width:100%;
					height:100%;
					border:none;
					border-radius:8px;
				`;

            iframe.onload = () => {
                loadingDiv.remove();
                iframe.style.display = "block";
            };

            iframe.onerror = () => {
                loadingDiv.textContent = "페이지를 불러올 수 없습니다.";
            };

            iframeContainer.appendChild(iframe);
            messageDiv.appendChild(iframeContainer);

            if (buttons && buttons.length > 0) {
                const buttonsDiv = document.createElement("div");
                buttonsDiv.className = "bot-buttons";

                buttons.forEach((button) => {
                    const btn = document.createElement("button");
                    btn.textContent = button.text;
                    btn.type = "button";

                    // 버튼에 URL이 있으면 전송 구분 (버튼 클릭시 이동)
                    if (button.url) {
                        btn.className = "bot-button url-button";
                        btn.onclick = () => window.open(button.url, "_blank");
                    } else {
                        btn.className = "bot-button";
                        btn.onclick = () =>
                            this.sendMessage(
                                button.value,
                                false,
                                "button_click"
                            );
                    }
                    buttonsDiv.appendChild(btn);
                });

                messageDiv.appendChild(buttonsDiv);
            }
            messagesContainer.appendChild(messageDiv);
            const messageOffsetTop = messageDiv.offsetTop - 70;
            messagesContainer.scrollTo({
                top: messageOffsetTop,
                behavior: "smooth",
            });
        }
        addSlides() {
            setTimeout(() => {
                if (
                    document.querySelector(
                        ".product-slide-wrap .swiper-container"
                    )
                ) {
                    new Swiper(".product-slide-wrap .swiper-container", {
                        spaceBetween: 8,
                        slidesPerView: 1.2,
                        pagination: {
                            el: ".product-slide-wrap .swiper-pagination2",
                            clickable: true,
                        },
                    });
                }
            }, 100);
        }

        bindEvents() {
            const input = document.getElementById("bot-input");
            const sendBtn = document.getElementById("bot-send");

            const sendMessage = () => {
                const message = input.value.trim();
                if (message) {
                    this.sendMessage(message, false, "user_input");
                    input.value = "";
                }
            };
            const saveInspection = (answer = "", intextarea = "") => {
                if (answer) {
                    this.saveInspection(answer, intextarea);
                }
            };

            sendBtn.addEventListener("click", sendMessage);
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") sendMessage();
            });

            // 퀵메뉴 팝업 스크립트
            const botMenuBtn = document.querySelector(
                ".bot-input-area .menu-btn"
            );
            const quickPopup = document.querySelector(".quick-popup");
            const quickMenuClose = document.querySelector(
                ".quick-popup .close-btn"
            );
            const botDimm = document.querySelector(".bot-dimm");

            botMenuBtn.addEventListener("click", function () {
                quickPopup.classList.add("on");
                botDimm.classList.add("on");
            });

            quickMenuClose.addEventListener("click", function (e) {
                e.preventDefault();
                quickPopup.classList.remove("on");
                botDimm.classList.remove("on");
            });

            botDimm.addEventListener("click", function () {
                quickPopup.classList.remove("on");
                botDimm.classList.remove("on");
            });

            document.addEventListener("click", function (e) {
                const btn = e.target.closest(".satisfaction-btn");

                // 만족도 버튼 클릭 시 처리
                if (btn) {
                    const btnGroup = btn.closest(".btn-group");
                    const statusText = document.querySelector(".status-txt");
                    if (!btnGroup || !statusText) return;

                    // 이미 on 클래스가 있으면 제거하고 텍스트 초기화
                    if (btn.classList.contains("on")) {
                        btn.classList.remove("on");
                        statusText.textContent = "";
                    } else {
                        // 다른 버튼 on 제거 후 선택한 버튼에 on 추가
                        btnGroup
                            .querySelectorAll(".satisfaction-btn")
                            .forEach((b) => b.classList.remove("on"));
                        btn.classList.add("on");

                        // 텍스트 변경
                        const messages = {
                            불만족: "아직 부족해요",
                            보통: "보통이에요",
                            만족: "만족해요",
                        };
                        const val = btn.dataset.satValue;
                        statusText.textContent = messages[val] || "";
                    }
                }

                // 입력 버튼 클릭 시 검증
                const submitBtn = e.target.closest(".bot-popup-button.primary");
                if (submitBtn) {
                    const popup = e.target.closest(".bot-popup");
                    if (!popup) return;

                    const selectedBtn = popup.querySelector(
                        ".satisfaction-btn.on"
                    );
                    const Intextarea = popup.querySelector(
                        'textarea[name="inspection"]'
                    );
                    const inspection = Intextarea?.value.trim();

                    // 의견 작성했는데 만족도 선택 안 했을 때
                    if (inspection && !selectedBtn) {
                        alert("만족도를 선택해주세요.");
                        return;
                    }
                    saveInspection(
                        selectedBtn.getAttribute("data-sat-value"),
                        inspection
                    );
                }
            });
        }

        async sendMessage(message, isAuto = false, messageType = "user_input") {
            if (!isAuto) {
                this.addMessage(message, "user");
            }

            // 입력 필드와 전송 버튼 비활성화
            this.setInputDisabled(true);

            // 로딩 말풍선 표시
            this.showLoadingMessage();

            try {
                const formData = new FormData();
                formData.append("driver", "web");
                formData.append("userId", this.userId);
                formData.append("message", message);
                formData.append("user", this.userId);
                formData.append("messageType", messageType);

                const response = await fetch(this.options.apiUrl, {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();
                // 로딩 말풍선 제거
                this.hideLoadingMessage();

                if (data.error) {
                    this.addMessage(
                        "오류가 발생했습니다: " + data.error,
                        "bot"
                    );
                } else if (data.messages) {
                    data.messages.forEach((msg) => {
                        // 팝업 응답인지 확인
                        if (msg.popup === true) {
                            const buttons = msg.buttons
                                ? msg.buttons.map((btn) => ({
                                      text: btn.text,
                                      action:
                                          btn.value === "close_popup"
                                              ? () => {}
                                              : () =>
                                                    this.sendMessage(btn.value),
                                  }))
                                : [];

                            this.showPopup(msg.title, msg.content, buttons);
                        } else if (msg.iframe) {
                            // iframe 메시지인 경우
                            this.addIframeMessage(
                                msg.url,
                                msg.height,
                                msg.buttons
                            );
                        } else if (
                            Array.isArray(msg.text) &&
                            msg.text.length > 1
                        ) {
                            // html이랑 메세지 동시 + 메세지 배열일 경우
                            msg.text.forEach((msg2) => {
                                // 일반 메시지 처리
                                const isHtml = msg2.html === true;
                                const url = msg2.url || null;
                                this.addMessage(
                                    msg2,
                                    "bot",
                                    msg2.buttons,
                                    isHtml,
                                    url
                                );
                            });
                        } else {
                            // 일반 메시지 처리
                            const isHtml = msg.html === true;
                            const url = msg.url || null;
                            this.addMessage(
                                msg.text,
                                "bot",
                                msg.buttons,
                                isHtml,
                                url
                            );
                        }
                    });
                }
            } catch (error) {
                this.hideLoadingMessage();
                this.addMessage("서버 연결에 실패했습니다.", "bot");
            } finally {
                // 입력 필드와 전송 버튼 다시 활성화
                this.setInputDisabled(false);
            }
        }

        addMessage(
            text,
            type,
            buttons = null,
            isHtml = false,
            url = null,
            messageChk = null
        ) {
            const messagesContainer = document.getElementById("bot-messages");
            const messageDiv = document.createElement("div");
            messageDiv.className = `bot-message ${type}`;

            // 읽기 전용 모드일 때는 URL 클릭 기능 비활성화
            if (url && !this.options.readOnly) {
                messageDiv.classList.add("clickable");
                messageDiv.onclick = () => {
                    window.open(url, "_blank");
                    /*this.showPopup(
									'링크 열기',
									`다음 링크로 이동하시겠습니까?\n${url}`,
									[
											{
													text: '새 창에서 열기',
													action: () => window.open(url, '_blank')
											},
											{
													text: '현재 창에서 열기',
													action: () => window.location.href = url
											},
											{
													text: '취소',
													action: () => {}
											}
									]
							);*/
                };
            }
            // 봇 메시지인 경우 이름 추가
            if (type === "bot") {
                const lastMessage = messagesContainer.lastElementChild;
                const isLastMessageBot =
                    lastMessage &&
                    lastMessage.classList.contains("bot-message") &&
                    lastMessage.classList.contains("bot") &&
                    type === "bot";

                // 마지막 메시지가 봇 메시지가 아닌 경우에만 이름과 아바타 추가
                if (!isLastMessageBot) {
                    const nameDiv = document.createElement("div");
                    nameDiv.className = "bot-name";
                    nameDiv.textContent = "컴퓨존 챗봇";
                    messageDiv.appendChild(nameDiv);
                }
            }

            const textDiv = document.createElement("div");
            // HTML 여부에 따라 다르게 처리
            if (isHtml) {
                textDiv.innerHTML = text;
            } else {
                textDiv.innerHTML = text.replace(/\n/g, "<br>");
            }
            messageDiv.appendChild(textDiv);
            // 읽기 전용 모드가 아닐 때만 클릭 안내 추가
            if (url && !this.options.readOnly) {
                const clickIndicator = document.createElement("div");
                clickIndicator.className = "click-indicator";
                clickIndicator.textContent = "클릭하여 링크 열기";
                messageDiv.appendChild(clickIndicator);
            }
            if (buttons && buttons.length > 0) {
                const buttonsDiv = document.createElement("div");
                buttonsDiv.className = "bot-buttons";

                buttons.forEach((button) => {
                    const btn = document.createElement("button");
                    btn.textContent = button.text;
                    btn.type = "button";
                    // 읽기 전용 모드일 때는 버튼 비활성화
                    if (this.options.readOnly) {
                        btn.className = "bot-button disabled";
                        btn.disabled = true;
                    } else {
                        // 버튼에 URL이 있으면 전송 구분 (버튼 클릭시 이동)
                        if (button.url) {
                            btn.className = "bot-button url-button";
                            btn.onclick = () => {
                                if (button.pop === true) {
                                    window_open(
                                        button.url,
                                        button.width,
                                        button.height,
                                        "scrollbars=yes",
                                        ""
                                    );
                                } else if (button.send === "href") {
                                    location.href = button.url;
                                } else {
                                    window.open(button.url, "_blank");
                                }
                            };
                        } else {
                            btn.className = "bot-button";
                            if (button.text === "처음으로") {
                                btn.className = "bot-use-pop";
                            }
                            btn.onclick = () =>
                                this.sendMessage(
                                    button.value,
                                    false,
                                    "button_click"
                                );
                        }
                    }
                    /*btn.onclick = () => {
									// 팝업으로 확인 후 메시지 전송
									this.showPopup(
											'선택 확인',
											`"${button.text}" 메뉴를 선택하시겠습니까?`,
											[
													{
															text: '확인',
															action: () => this.sendMessage(button.value)
													},
													{
															text: '취소',
															action: () => {} // 아무것도 하지 않음
													}
											]
									);
								};*/
                    buttonsDiv.appendChild(btn);
                });

                messageDiv.appendChild(buttonsDiv);
            }
            if (
                (text.indexOf("안녕하세요") !== -1 &&
                    text.indexOf("무엇을 도와드릴까요") !== -1) ||
                (text.indexOf("로그인") !== -1 && text.indexOf("메뉴") !== -1)
            ) {
                if (!this.options.readOnly) {
                    const chatmessage = document.createElement("div");
                    chatmessage.textContent = "챗봇 이용 가이드";
                    chatmessage.className = "bot-use-pop";
                    chatmessage.onclick = () => {
                        showGuidePop();
                    };
                    messageDiv.appendChild(chatmessage);
                }
            }

            messagesContainer.appendChild(messageDiv);
            const allBotNames = messagesContainer.querySelectorAll(".bot-name");
            // 카테고리 선택시
            if (
                (messageChk !== "history" &&
                    text.indexOf('data-slide-list-chk="div"') !== -1) ||
                text.indexOf('data-slide-list-chk="mediumdiv"') !== -1
            ) {
                const allBotMessage =
                    messagesContainer.querySelectorAll(".bot-message");
                const lastBotName = allBotMessage[allBotMessage.length - 2];
                const containerRect = messagesContainer.getBoundingClientRect();
                const containerScrollTop = messagesContainer.scrollTop;
                const lastBotNameRect = lastBotName.getBoundingClientRect();

                const lastBotNameTopInContainer =
                    lastBotNameRect.top -
                    containerRect.top +
                    containerScrollTop -
                    10;

                messagesContainer.scrollTop = lastBotNameTopInContainer;
            } else if (messageChk !== "history" && allBotNames) {
                const lastBotName = allBotNames[allBotNames.length - 1];
                const containerRect = messagesContainer.getBoundingClientRect();
                const containerScrollTop = messagesContainer.scrollTop;
                const lastBotNameRect = lastBotName.getBoundingClientRect();

                const lastBotNameTopInContainer =
                    lastBotNameRect.top -
                    containerRect.top +
                    containerScrollTop;

                messagesContainer.scrollTop = lastBotNameTopInContainer;
            } else {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        showLoadingMessage() {
            const messagesContainer = document.getElementById("bot-messages");
            const loadingDiv = document.createElement("div");
            loadingDiv.className = "bot-message loading";
            loadingDiv.id = "bot-loading-message";
            loadingDiv.innerHTML = `
							
							<div class="typing-indicator">
									<span></span>
									<span></span>
									<span></span>
							</div>
					`;
            messagesContainer.appendChild(loadingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        hideLoadingMessage() {
            const loadingDiv = document.getElementById("bot-loading-message");
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }

        setInputDisabled(disabled) {
            const input = document.getElementById("bot-input");
            const sendBtn = document.getElementById("bot-send");

            if (input && sendBtn) {
                input.disabled = disabled;
                sendBtn.disabled = disabled;

                if (disabled) {
                    input.placeholder = "응답을 기다리는 중...";
                } else {
                    input.placeholder = this.options.placeholder;
                    input.focus();
                }
            }
        }

        generateUserId() {
            return "user_" + Math.random().toString(36).substr(2, 9);
        }

        show() {
            document.querySelector(".bot-widget").style.display = "flex";
        }

        hide() {
            document.querySelector(".bot-widget").style.display = "none";
        }

        destroy() {
            const widget = document.querySelector(".bot-widget");
            if (widget) widget.remove();
        }
        showPopup(title = "", content = "", buttons = []) {
            if (title === "") {
                title = "이용하신 챗봇, 어떠셨나요?";
            }
            if (content === "") {
                content = `<div class="survey-wrap">
												<div class="btn-group">
														<button type="button" class="satisfaction-btn bad" data-sat-value="불만족"><span class="blind">불만족</span></button>
														<button type="button" class="satisfaction-btn normal" data-sat-value="보통"><span class="blind">보통</span></button>
														<button type="button" class="satisfaction-btn good on" data-sat-value="만족"><span class="blind">만족</span></button>
												</div>
												<p class="status-txt">만족해요</p>
												<div class="input-area">
														<textarea name="inspection" id="inspection" placeholder="추가 의견을 입력해 주세요."></textarea>
												</div>
										</div>`;
            }
            buttons = [
                {
                    text: "입력",
                },
            ];
            const widget = document.querySelector(".bot-widget");
            widget.style.position = "relative";

            const overlay = document.createElement("div");
            overlay.className = "bot-popup-overlay";
            overlay.onclick = (e) => {
                if (e.target === overlay) this.hidePopup();
            };

            const popup = document.createElement("div");
            popup.className = "bot-popup";

            const header = document.createElement("div");
            header.className = "bot-popup-header";

            const titleEl = document.createElement("h4");
            titleEl.className = "bot-popup-title";
            titleEl.textContent = title;

            const closeBtn = document.createElement("button");
            closeBtn.className = "bot-popup-close";
            closeBtn.onclick = () => this.hidePopup2();

            header.appendChild(titleEl);
            header.appendChild(closeBtn);

            const contentEl = document.createElement("div");
            contentEl.className = "bot-popup-content";
            // HTML 콘텐츠는 innerHTML로, 일반 텍스트는 텍스트 처리
            if (content.includes("<")) {
                contentEl.innerHTML = content;
            } else {
                contentEl.innerHTML = content.replace(/\n/g, "<br>");
            }

            // 만족도 팝업 테스트용 - 전산 작업 시 수정 및 지워주세요
            setTimeout(() => {
                const defaultBtn = contentEl.querySelector(
                    ".satisfaction-btn.good"
                );
                const statusText = contentEl.querySelector(".status-txt");

                if (defaultBtn) defaultBtn.classList.add("on");
                if (statusText) statusText.textContent = "만족해요";
            }, 0);

            const buttonsEl = document.createElement("div");
            buttonsEl.className = "bot-popup-buttons";

            buttons.forEach((button, index) => {
                const btn = document.createElement("button");
                btn.className = `bot-popup-button ${
                    index === 0 ? "primary" : "secondary"
                }`;
                btn.textContent = button.text;
                btn.onclick = () => {
                    //this.hidePopup();
                    if (button.action) button.action();
                };
                buttonsEl.appendChild(btn);
            });

            // 기본 닫기 버튼이 없으면 추가
            if (buttons.length === 0) {
                const closeButton = document.createElement("button");
                closeButton.className = "bot-popup-button secondary";
                closeButton.textContent = "닫기";
                closeButton.onclick = () => this.hidePopup();
                buttonsEl.appendChild(closeButton);
            }

            popup.appendChild(header);
            popup.appendChild(contentEl);
            popup.appendChild(buttonsEl);
            overlay.appendChild(popup);
            widget.appendChild(overlay);
        }

        hidePopup() {
            const popup = document.querySelector(".bot-popup-overlay");
            if (popup) popup.remove();
            this.hide();
        }
        hidePopup2() {
            fn_SetCookie2("chat-satisfaction");
            const popup = document.querySelector(".bot-popup-overlay");
            if (popup) popup.remove();
            this.hide();
        }
        //
        async showMenu() {
            try {
                const formData = new FormData();
                formData.append("driver", "web");
                formData.append("userId", this.userId);
                formData.append("message", "show_menu");
                formData.append("user", this.userId);

                const response = await fetch(this.options.apiUrl, {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();

                if (data.error) {
                    this.addMessage(
                        "오류가 발생했습니다: " + data.error,
                        "bot"
                    );
                } else if (data.messages) {
                    if (data.messages[0]) {
                        $("#quick-menu").html(data.messages[0]);
                        $(".bot-dimm").addClass("on");
                        $(".quick-popup").addClass("on");
                    }
                }
            } catch (error) {
                this.addMessage("서버 연결에 실패했습니다.", "bot");
            } finally {
                // 입력 필드와 전송 버튼 다시 활성화
                this.setInputDisabled(false);
            }
        }
        async showGuide() {
            try {
                $.get("../chat/chatbot_guide.htm", function (html) {
                    $(".bot-guide-wrap").html(html);
                });
                $(".bot-guide-wrap").addClass("on");
            } catch (error) {
                this.addMessage("서버 연결에 실패했습니다.", "bot");
            } finally {
                // 입력 필드와 전송 버튼 다시 활성화
                this.setInputDisabled(false);
            }
        }

        async saveInspection(selectedBtn, Intextarea = "") {
            try {
                const formData = new FormData();
                formData.append("driver", "web");
                formData.append("action", "save_inspection"); // 히스토리 로드 액션
                formData.append("selectedBtn", selectedBtn);
                formData.append("Intextarea", Intextarea);
                formData.append("user", this.userId);

                const response = await fetch(this.options.apiUrl, {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();
                if (data.error) {
                    this.addMessage(
                        "오류가 발생했습니다: " + data.error,
                        "bot"
                    );
                } else if (data.success) {
                    this.hidePopup2();
                }
            } catch (error) {
                this.addMessage("서버 연결에 실패했습니다.", "bot");
            } finally {
                // 입력 필드와 전송 버튼 다시 활성화
                this.setInputDisabled(false);
            }
        }
    }

    // 전역 객체
    window.botmanWidget = {
        create: (options) => new SimpleBotWidget(options),
    };
})();
$(() => {
    // 퀵메뉴 토글 테스트
    const menuBtn = $(".menu-btn");
    const botDimm = $(".bot-dimm");
    const quickPop = $(".quick-popup");
    const quickPopClose = $(".quick-popup .close-btn");
    const slidePopup = $(".slide-popup");
    const slidePopClose = $(".slide-popup .close-btn");

    menuBtn.on("click", function () {
        quickPop.toggleClass("on");
        botDimm.toggleClass("on");
    });

    botDimm.on("click", function () {
        botPopClose();
    });

    quickPopClose.on("click", function (e) {
        e.preventDefault();
        botPopClose();
    });

    // 만족도조사 팝업 테스트
    const botPopupClose = $(".bot-popup-close");
    const botPopup = $(".bot-popup-overlay");
    const testBtn = $(".test-btn");
    const satisfactionBtn = $(".satisfaction-btn");

    botPopupClose.on("click", function () {
        botPopup.hide();
    });

    testBtn.on("click", function () {
        botPopup.show();
    });

    $(".satisfaction-btn").on("click", function () {
        const $this = $(this);
        const $group = $this.closest(".btn-group");
        const $statusText = $(".status-txt");
        const value = $this.data("satValue");

        const messages = {
            불만족: "아직 부족해요",
            보통: "보통이에요",
            만족: "만족해요",
        };

        if ($this.hasClass("on")) {
            // 이미 선택된 상태면 해제
            $this.removeClass("on");
            $statusText.text(""); // 텍스트도 초기화
        } else {
            // 새로 선택된 버튼이면 다른 버튼들 off, 자신은 on
            $group.find(".satisfaction-btn").removeClass("on");
            $this.addClass("on");
            $statusText.text(messages[value] || "");
        }
    });

    $(".bot-popup-button.primary").on("click", function () {
        const $popup = $(this).closest(".bot-popup");
        const $selectedBtn = $popup.find(".satisfaction-btn.on");
        const inspection = $.trim(
            $popup.find('textarea[name="inspection"]').val()
        );

        if (inspection && $selectedBtn.length === 0) {
            alert("만족도를 선택해주세요.");
            return;
        }

        // 만족도 선택됐고 의견도 있거나, 만족도만 선택된 경우
        // 창 닫기
        $popup.closest(".bot-popup-overlay").hide();
    });
});

// 데모 함수들
let widget = null;

function initWidget(initialData = null, readOnly = false) {
    if (widget) {
        widget.show();
    } else {
        widget = window.botmanWidget.create({
            container: "#widget-container",
            apiUrl: "../chat/com_chat.php",
            title: "컴퓨존 상담 챗봇",
            placeholder: "궁금한 내용을 여기에 입력해 주세요.",
            autoStart: true,
            primaryColor: "#007bff",
            readOnly: readOnly, // 읽기 전용 모드 설정
            initialData: initialData, // 초기 데이터 설정
        });
    }
}

function loadBotCSS() {
    if (document.getElementById("bot-style-link")) return;

    const link = document.createElement("link");
    link.id = "bot-style-link";
    link.rel = "stylesheet";
    link.href = "../css/chatbot.css"; // 정확한 경로로
    document.head.appendChild(link);
}

// Swiper 초기화 함수
function initSwiper(container) {
    const widgetContainer = document.querySelector("#widget-container");
    if (!container || container.classList.contains("swiper-initialized"))
        return;
    if (!widgetContainer || !widgetContainer.contains(container)) return;

    const slideWrap = container.closest(".slide-wrap");
    const paginationEl = slideWrap?.querySelector(".swiper-pagination2"); // 안전하게 접근

    const swiperOptions = {
        spaceBetween: 8,
        slidesPerView: 1.2,
        mousewheel: true,
    };

    // pagination이 존재할 때만 옵션 추가
    if (paginationEl) {
        swiperOptions.pagination = {
            el: paginationEl,
            clickable: true,
        };
    }

    new Swiper(container, swiperOptions);
}

// MutationObserver: DOM에 추가되는 swiper-container를 감지
const observer_chat = new MutationObserver((mutations) => {
    const widgetContainer = document.querySelector("#widget-container");

    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return; // 요소 노드만 처리

            // 1. node가 swiper-container이고 widget-container 안에 있으면 실행
            if (
                node.classList?.contains("swiper-container") &&
                widgetContainer?.contains(node)
            ) {
                initSwiper(node);
                return;
            }

            // 2. node 내부에 있는 swiper-container 중 widget-container 안에 있는 것만 실행
            const containers =
                node.querySelectorAll?.(".swiper-container") || [];
            containers.forEach((container) => {
                if (widgetContainer?.contains(container)) {
                    initSwiper(container);
                }
            });
        });
    });
});

// observer 시작
observer_chat.observe(document.body, {
    childList: true,
    subtree: true,
});

// 서브
// [69614] 품절 시 비슷한 상품 노출 기능
function sameProductPopupChat(productNo, sameCount) {
    if (sameCount) {
        window_open(
            "../product/similar_product_popup.htm?ProductNo=" +
                productNo +
                "&callAction=basket_page_insert_similar",
            "634",
            "680",
            "scrollbars=yes",
            "sameProductBasketPop"
        );
    } else {
        window.parent.postMessage(
            {
                type: "botman-message",
                message: "비슷한 상품 보기",
            },
            "*"
        );
    }
}

function ReturnOrderPopChat(productNo, t) {
    var Opn = $(t).data("opn");
    var Pid = $(t).data("pid");
    var Pg = $(t).data("pg");
    var Uid = $(t).data("uid");
    var Type = $(t).data("type");

    if (!Uid) {
        if (Type != "chat") {
            LayerPopLogin("이용");
            return;
        } else {
            window.open("../login/login.htm?ty=chat", "_blank");
            return;
        }
    }
    window_open(
        "../pop_page/return_order.htm?act=list&ProductNo=" + productNo,
        "667",
        "700",
        "scrollbars=yes",
        "sameProductBasketPop"
    );
}

function popOff() {
    $(".bot-dimm").removeClass("on");
    $(".quick-popup").removeClass("on");
}

function sendMessageAndClose(message, hidden = false) {
    window.parent.postMessage(
        {
            type: "botman-message",
            hidden: hidden,
            message: message,
        },
        "*"
    );

    setTimeout(() => {
        window.close();
    }, 100);
}

function optionProductSend(productNo) {
    alert("상세페이지에서 옵션을 선택해 주세요.");
    window.open(
        "../product/product_detail.htm?ProductNo=" + productNo,
        "_blank"
    );
}

function fn_SetCookie2(CookieId) {
    var todayDate = new Date();
    todayDate.setDate(todayDate.getDate() + 1);
    todayDate.setHours(0, 0, 0, 0);
    document.cookie =
        CookieId +
        "=" +
        escape("Y") +
        "; path=/; expires=" +
        todayDate.toUTCString() +
        ";";
}
