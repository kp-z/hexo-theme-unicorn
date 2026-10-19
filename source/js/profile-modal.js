/*!
 * R-298（round-071）：profile 页居中弹窗（微信二维码 / 简历预览）
 *
 * 触发端：theme.profile.buttons[] 里带 modal 字段的按钮，由模板输出
 *   a.author-btn[data-profile-modal][data-profile-modal-src][data-profile-modal-title]
 *              [data-profile-modal-desc][data-profile-modal-download]
 *   （模板见 layout/pages/profile.pug；字段语义见主题 _config.yml 的 profile.buttons 注释）
 * 弹窗骨架：#profile-modal（同文件末尾单例）。
 *
 * 设计要点（与站内既有约定一致）：
 * - **无 JS 降级**：按钮仍带 href 指向原图/PDF；本脚本拦截普通左键点击后 preventDefault，
 *   Ctrl/Cmd/中键等一律放行（保留新标签打开）。
 * - **幂等**：脚本经 inject.assets（slot: bottom + pjax: true）在 profile 页注入，pjax 进出会重建执行；
 *   用 document 级事件委托 + window 标记，重复执行不会重复绑定。
 * - **pjax**：pjax:send 时关闭弹窗并解锁滚动（避免离开页面后 body 仍 overflow:hidden）。
 * - **可访问性**：role=dialog + aria-modal，打开时聚焦关闭按钮、Tab 焦点圈内循环、Esc/遮罩/关闭按钮均可关闭，
 *   关闭后焦点回到触发按钮。
 */
(function () {
  'use strict'

  var MODAL_ID = 'profile-modal'
  var BODY_OPEN_CLASS = 'profile-modal-open'
  var INIT_FLAG = '__alProfileModalInit'
  var SVG_NS = 'http://www.w3.org/2000/svg'

  if (window[INIT_FLAG]) return
  window[INIT_FLAG] = true

  var state = { lastFocus: null }

  function byId (id) {
    return document.getElementById(id)
  }

  function pick (selector, root) {
    return (root || document).querySelector(selector)
  }

  function modalElement () {
    return byId(MODAL_ID)
  }

  function lockBody () {
    document.body.classList.add(BODY_OPEN_CLASS)
  }

  function unlockBody () {
    document.body.classList.remove(BODY_OPEN_CLASS)
  }

  // 从 URL 取可读文件名（兼容中文/括号的百分号编码；下载时作为建议文件名）
  function baseName (url) {
    try {
      var clean = String(url || '').split('#')[0].split('?')[0]
      var name = clean.substring(clean.lastIndexOf('/') + 1)
      return decodeURIComponent(name)
    } catch (e) {
      return ''
    }
  }

  function isPdfUrl (url) {
    return /\.pdf$/i.test(String(url || '').split('#')[0].split('?')[0])
  }

  function focusSafely (el) {
    if (!el || typeof el.focus !== 'function') return
    try {
      el.focus({ preventScroll: true })
    } catch (e) {
      try { el.focus() } catch (e2) { /* noop */ }
    }
  }

  function close (restoreFocus) {
    var modal = modalElement()
    if (modal) {
      if (modal.hidden) {
        unlockBody()
        return
      }
      modal.hidden = true
      modal.removeAttribute('data-kind')
      modal.classList.remove('is-open')
      var body = pick('.profile-modal__body', modal)
      if (body) body.textContent = '' // 移除 iframe/img，立即停止加载
    }
    unlockBody()
    var target = state.lastFocus
    state.lastFocus = null
    if (restoreFocus && target && document.contains(target)) focusSafely(target)
  }

  function open (trigger) {
    var modal = modalElement()
    if (!modal) return false

    var src = trigger.getAttribute('data-profile-modal-src') || trigger.getAttribute('href') || ''
    if (!src) return false

    var kind = String(trigger.getAttribute('data-profile-modal') || '').toLowerCase()
    var title = trigger.getAttribute('data-profile-modal-title') || ''
    var desc = trigger.getAttribute('data-profile-modal-desc') || ''
    var downloadLabel = trigger.getAttribute('data-profile-modal-download') || '下载'
    var pdf = kind === 'pdf' || isPdfUrl(src)

    var body = pick('.profile-modal__body', modal)
    var titleEl = pick('.profile-modal__title', modal)
    var descEl = pick('.profile-modal__desc', modal)
    var foot = pick('.profile-modal__foot', modal)
    var download = pick('.profile-modal__download', modal)
    var hint = pick('.profile-modal__hint', modal)
    var closeBtn = pick('.profile-modal__close', modal)
    if (!body || !titleEl || !descEl || !download || !foot) return false

    // 重置内容（重复打开不同按钮时互不串味）
    body.textContent = ''
    titleEl.textContent = title || '预览'
    descEl.textContent = desc
    descEl.hidden = !desc
    modal.setAttribute('data-kind', pdf ? 'pdf' : 'image')

    if (pdf) {
      var frame = document.createElement('iframe')
      frame.className = 'profile-modal__pdf'
      frame.title = title || '简历预览'
      frame.setAttribute('loading', 'eager')
      frame.src = src
      body.appendChild(frame)

      var filename = baseName(src) || ((title || 'resume') + '.pdf')
      download.href = src
      download.setAttribute('download', filename)
      download.textContent = downloadLabel
      foot.hidden = false
      if (hint) hint.hidden = false
    } else {
      var img = document.createElement('img')
      img.className = 'profile-modal__img'
      img.alt = title || '图片预览'
      img.decoding = 'async'
      img.src = src
      body.appendChild(img)

      download.removeAttribute('href')
      download.removeAttribute('download')
      download.textContent = ''
      foot.hidden = true
      if (hint) hint.hidden = true
    }

    // 记录焦点来源：鼠标点击通常已把焦点给到链接，但程序化 click()/部分浏览器不会，
    // 兜底用触发按钮，保证关闭后焦点能回到原处（a11y / 键盘用户）。
    var active = document.activeElement
    state.lastFocus = active && active !== document.body && document.contains(active) ? active : trigger
    modal.hidden = false
    modal.classList.add('is-open')
    lockBody()
    focusSafely(closeBtn || modal)
    return true
  }

  function isOpen () {
    var modal = modalElement()
    return !!modal && !modal.hidden
  }

  // 点击委托：打开 / 关闭（含遮罩、X 按钮）。
  // **capture 阶段**：pjax 在 document 上也有 click 监听（pjax.pug，先于本脚本注册），
  // 若本监听用冒泡，pjax 会先把按钮当成站内链接去 loadUrl（用户报障：点微信跳到 JPEG）。
  // 捕获阶段先接管并 stopPropagation，pjax 的监听根本收不到这次点击。
  document.addEventListener('click', function (ev) {
    var target = ev.target
    if (!target || !target.closest) return

    var closer = target.closest('[data-profile-modal-close]')
    if (closer) {
      ev.preventDefault()
      ev.stopPropagation()
      close(true)
      return
    }

    var trigger = target.closest('[data-profile-modal]')
    if (!trigger) return

    // 只接管普通左键；Ctrl/Cmd/Shift/Alt + 左键、中键、右键等保留浏览器原生行为
    if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return
    if (open(trigger)) {
      ev.preventDefault()
      ev.stopPropagation()
    }
  }, true)

  // 键盘：Esc 关闭；Tab 焦点在对话框内循环
  document.addEventListener('keydown', function (ev) {
    if (!isOpen()) return
    var modal = modalElement()
    if (!modal) return

    if (ev.key === 'Escape' || ev.key === 'Esc') {
      ev.preventDefault()
      close(true)
      return
    }
    if (ev.key !== 'Tab') return

    var dialog = pick('.profile-modal__dialog', modal)
    if (!dialog) return
    var focusables = dialog.querySelectorAll('button, a[href], iframe, [tabindex]:not([tabindex="-1"])')
    if (!focusables.length) return
    var first = focusables[0]
    var last = focusables[focusables.length - 1]
    var active = document.activeElement

    if (ev.shiftKey && (active === first || active === dialog)) {
      ev.preventDefault()
      focusSafely(last)
    } else if (!ev.shiftKey && active === last) {
      ev.preventDefault()
      focusSafely(first)
    }
  }, false)

  // pjax：离开页面时关掉弹窗，避免遮罩/滚动锁残留；完成后兜底解锁。
  document.addEventListener('pjax:send', function () { close(false) }, false)
  document.addEventListener('pjax:complete', function () {
    if (!modalElement()) close(false)
  }, false)
})()
