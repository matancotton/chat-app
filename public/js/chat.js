const socket = io()

const $form = document.getElementById('form')
const $messageFormInput = $form.querySelector('input')
const $messageFormButton = $form.querySelector('button')
const $sendLocationButton = document.getElementById('send-location')
const $messages = document.getElementById('messages')

// Templates

const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML
// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = ()=>{
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    const html = Mustache.render(messageTemplate,{
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm a'),
        username: message.username
    }) 
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()

})

socket.on('locationMessage', (location)=>{
    const html = Mustache.render(locationTemplate,{
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('H:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users })=>{
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.getElementById('sidebar').innerHTML = html
})

$form.addEventListener('submit',(event)=>{
    event.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    const message = $messageFormInput.value
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }

        console.log('message deliverd')
    })
    
})

$sendLocationButton.addEventListener('click', ()=>{
    if (!navigator.geolocation) {
        return alert('Geoclocation is not supported by uour browser.')
    }
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',
        {lat:position.coords.latitude,
        long:position.coords.longitude},
        ()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location has been shared!!!')
        })
    })
})

socket.emit('join',{ username,room }, (error)=>{
    if (error) {
        alert(error)
        location.href = '/'
    }
})