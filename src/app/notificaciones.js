export const showMessage = (mensaje, type = "success", duration = 3000) => {
    // 1. Crea el elemento del mensaje
    const messageElement = document.createElement("div");

    // 2. Le asigna una clase para poder estilizarlo si es necesario
    messageElement.className = "toast-message";
    
    // 3. Establece el contenido y los estilos directamente en el elemento
    messageElement.textContent = mensaje;
    messageElement.style.position = "fixed";
    messageElement.style.bottom = "20px";
    messageElement.style.right = "20px";
    messageElement.style.padding = "15px 25px";
    messageElement.style.borderRadius = "8px";
    messageElement.style.color = "white";
    // ⚠️ La clave está en este z-index muy alto para asegurar visibilidad
    messageElement.style.zIndex = "2147483647"; 
    messageElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    messageElement.style.transition = "opacity 0.5s ease-in-out, transform 0.5s ease-in-out";
    messageElement.style.transform = "translateY(50px)";
    messageElement.style.opacity = "0";

    // 4. Aplica el color de fondo según el tipo
    if (type === "success") {
        messageElement.style.backgroundColor = "#4CAF50"; // Verde
    } else if (type === "error") {
        messageElement.style.backgroundColor = "#F44336"; // Rojo
    } else {
        messageElement.style.backgroundColor = "#2196F3"; // Azul por defecto
    }

    // 5. Agrega el elemento al cuerpo del documento
    document.body.appendChild(messageElement);

    // 6. Activa la animación para que aparezca
    setTimeout(() => {
        messageElement.style.opacity = "1";
        messageElement.style.transform = "translateY(0)";
    }, 10);

    // 7. Configura un temporizador para que desaparezca automáticamente
    setTimeout(() => {
        messageElement.style.opacity = "0";
        messageElement.style.transform = "translateY(50px)";
        // Elimina el elemento del DOM después de que la transición termine
        setTimeout(() => {
            messageElement.remove();
        }, 500);
    }, duration);
}