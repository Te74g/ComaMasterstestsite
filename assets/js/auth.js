(function (global) {
  "use strict";

  // ===================================================
  // Auth Helper — 各ページから呼び出す共通関数
  // ===================================================

  const auth = firebase.auth();

  const googleProvider  = new firebase.auth.GoogleAuthProvider();

  // ── ヘッダーの認証ボタンを状態に応じて切り替え ──────────────
  function bindAuthHeader() {
    const loginBtn  = document.getElementById("headerLoginBtn");
    const userBtn   = document.getElementById("headerUserBtn");
    const userAvatar = document.getElementById("headerUserAvatar");

    auth.onAuthStateChanged(function (user) {
      if (!loginBtn || !userBtn) return;

      if (user) {
        loginBtn.style.display  = "none";
        userBtn.style.display   = "flex";
        if (userAvatar) {
          userAvatar.src = user.photoURL || "../assets/img/default-avatar.webp";
        }
      } else {
        loginBtn.style.display  = "flex";
        userBtn.style.display   = "none";
      }
    });
  }

  // ── メール＆パスワードでログイン ────────────────────────────
  function loginWithEmail(email, password, onError) {
    return auth.signInWithEmailAndPassword(email, password)
      .catch(function (err) { if (onError) onError(err); });
  }

  // ── Google でログイン ────────────────────────────────────────
  function loginWithGoogle(onError) {
    return auth.signInWithPopup(googleProvider)
      .catch(function (err) { if (onError) onError(err); });
  }

  // ── メール＆パスワードで新規登録 ────────────────────────────
  function registerWithEmail(email, password, displayName, onError) {
    return auth.createUserWithEmailAndPassword(email, password)
      .then(function (cred) {
        return cred.user.updateProfile({ displayName: displayName });
      })
      .catch(function (err) { if (onError) onError(err); });
  }

  // ── ログアウト ───────────────────────────────────────────────
  function logout() {
    return auth.signOut();
  }

  // ── 未ログインなら login にリダイレクト ─────────────────────
  function requireAuth(rootPath) {
    auth.onAuthStateChanged(function (user) {
      if (!user) {
        global.location.href = (rootPath || "/") + "login/";
      }
    });
  }

  // ── ログイン済みなら mypage にリダイレクト ──────────────────
  function redirectIfLoggedIn(rootPath) {
    auth.onAuthStateChanged(function (user) {
      if (user) {
        global.location.href = (rootPath || "/") + "mypage/";
      }
    });
  }

  // ── Firebase エラーコードを日本語に変換 ─────────────────────
  function errorMessage(code) {
    const map = {
      "auth/invalid-email":            "メールアドレスの形式が正しくありません",
      "auth/user-not-found":           "アカウントが見つかりません",
      "auth/wrong-password":           "パスワードが正しくありません",
      "auth/email-already-in-use":     "そのメールアドレスはすでに使われています",
      "auth/weak-password":            "パスワードは6文字以上にしてください",
      "auth/too-many-requests":        "ログイン試行が多すぎます。しばらくしてから再度お試しください",
      "auth/popup-closed-by-user":     "ログインがキャンセルされました",
      "auth/network-request-failed":   "ネットワークエラーが発生しました",
      "auth/invalid-credential":       "メールアドレスまたはパスワードが正しくありません",
    };
    return map[code] || "エラーが発生しました（" + code + "）";
  }

  // ── グローバルに公開 ─────────────────────────────────────────
  global.CMA = global.CMA || {};
  global.CMA.auth           = auth;
  global.CMA.bindAuthHeader = bindAuthHeader;
  global.CMA.loginWithEmail = loginWithEmail;
  global.CMA.loginWithGoogle = loginWithGoogle;
  global.CMA.registerWithEmail = registerWithEmail;
  global.CMA.logout         = logout;
  global.CMA.requireAuth    = requireAuth;
  global.CMA.redirectIfLoggedIn = redirectIfLoggedIn;
  global.CMA.errorMessage   = errorMessage;

})(window);
