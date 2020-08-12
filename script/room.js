const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById("js-local-stream");
  const joinTrigger = document.getElementById("js-join-trigger");
  const leaveTrigger = document.getElementById("js-leave-trigger");
  const remoteVideos = document.getElementById("js-remote-streams");
  const roomId = document.getElementById("js-room-id");
  const roomMode = document.getElementById("js-room-mode");
  const localText = document.getElementById("js-local-text");
  const sendTrigger = document.getElementById("js-send-trigger");
  const messages = document.getElementById("js-messages");
  const meta = document.getElementById("js-meta");
  const sdkSrc = document.querySelector("script[src*=skyway]");

  // meta.innerText = `
  //   UA: ${navigator.userAgent}
  //   SDK: ${sdkSrc ? sdkSrc.src : "unknown"}
  // `.trim();

  const getRoomModeByHash = () => (location.hash === "#sfu" ? "sfu" : "mesh");

  // roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    "hashchange",
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: 'c169b719-4211-4ef9-bbd5-d3be2645e59f',
    debug: 3,
  }));

  joinTrigger.addEventListener("click", () => {
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(roomId.value, {
      mode: getRoomModeByHash(),
      stream: localStream,
    });

    room.once("open", () => {
      messages.textContent += "[ message: 接続しました ] \n";
    });
    room.on("peerJoin", (peerId) => {
      // messages.textContent += `${peerId}が入室しました。\n`;
    });

    room.on("stream", async (stream) => {
      const newVideo = document.createElement("video");
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      newVideo.setAttribute("data-peer-id", stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    // document.getElementById("js-remote-streams").append(document.createElement("video"));

    room.on("data", ({ data, src }) => {
      // messages.textContent += `${src}: ${data}\n`;
      messages.textContent += `相手: ${data}\n`;
    });

    room.on("peerLeave", (peerId) => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id=${peerId}]`
      );
      remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      // messages.textContent += `=== ${peerId} left ===\n`;
    });

    room.once("close", () => {
      sendTrigger.removeEventListener("click", onClickSend);
      // messages.textContent += "== You left ===\n";
      messages.textContent += "[ message: 終了しました ]\n";
      Array.from(remoteVideos.children).forEach((remoteVideo) => {
        remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener("click", onClickSend);
    leaveTrigger.addEventListener("click", () => room.close(), { once: true });

    // チャット送信
    function onClickSend() {
      room.send(localText.value);
      messages.textContent += `自分:${localText.value}\n`;
      localText.value = "";
    }
  });

  peer.on("error", console.error);
})();
