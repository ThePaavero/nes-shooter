const DebugView = () => {
  const domElement = document.querySelector('.state-debugger')
  let viewActivated = false
  let pre = null

  const toggleActive = e => {
    e.preventDefault()
    viewActivated = !viewActivated
    domElement.classList[viewActivated ? 'add' : 'remove']('active')
  }

  if (domElement) {
    domElement.addEventListener('click', toggleActive)
    domElement.innerHTML = `
    <pre>
    </pre>
    `
    pre = domElement.querySelector('pre')
    pre.addEventListener('click', toggleActive)
  }

  const update = (state) => {
    pre.innerHTML = JSON.stringify(state, null, 2)
  }

  return {
    update
  }
}

export default DebugView()
