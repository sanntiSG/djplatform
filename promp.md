Quiero que actúes como un equipo senior de producto, diseño y desarrollo frontend/backend.
Utiliza estas skills: "skillsgpt-tasteskill", "emil-design-eng" e "impeccable".
Todo lo nuevo que agregues debe integrarse sin romper la estructura original.
OBJETIVO GENERAL Crear una plataforma web para DJs y otros perfiles relacionados con la música en Argentina, pensada para conectar a quienes ofrecen servicios con clientes que buscan DJs, productores y perfiles personalizables. La experiencia debe ser muy visual, moderna, descontracturada y premium, con una estética oscura, bordes redondeados, algo de estilo iOS, Apple Music e Instagram, tipografías llamativas y animaciones suaves pero impactantes.
ALCANCE INICIAL La plataforma será gratuita en esta etapa. Más adelante podrá monetizarse, pero por ahora no debe incluir lógica de pago.
PAÍS Solo Argentina.
ESTRUCTURA DE USUARIO Debe existir una sola cuenta por usuario. Al registrarse, el usuario crea su cuenta normal y más adelante podrá elegir si quiere:
•	solo buscar servicios
•	ofrecer servicios
No debe obligarse esa elección en el registro inicial.
PERFILES Los perfiles deben ser altamente personalizables y orientados a servicios musicales. Deben contemplar no solo DJs, sino también productores y otros perfiles similares. El perfil debe tener campos estructurados, no solo texto libre.
Campos y secciones sugeridas:
•	nombre o nombre artístico
•	foto de perfil
•	bio
•	ubicación
•	géneros musicales
•	tipo de eventos o fiestas
•	música o videos embebidos
•	disponibilidad
•	eventos publicados
•	contacto por WhatsApp
•	otros campos personalizables según el tipo de servicio
La personalización debe ser flexible, pero mantener una base estructurada para facilitar búsquedas y filtros.
MÚSICA Y VIDEO Los usuarios podrán agregar links de:
•	Spotify
•	SoundCloud
•	YouTube
El sistema detecta automáticamente la plataforma a partir de la URL pegada por el usuario.
Para YouTube: se extrae el ID del video y se renderiza con https://www.youtube.com/embed/ID. No tiene restricciones de CORS.
Para SoundCloud: el backend consulta la API pública de oEmbed (https://soundcloud.com/oembed?url=URL&format=json) sin necesidad de API key, obtiene el HTML del iframe y lo guarda en la base de datos como embedHtml.
Para Spotify: se extrae el ID del track o playlist y se renderiza con https://open.spotify.com/embed/track/ID. El estilo visual está limitado por las restricciones propias de Spotify.
Esos contenidos deben embeberse dentro de la app sin abrir nuevas pestañas. También se podrán agregar videos o material visual dentro del perfil.
Los medios se guardan en MongoDB como objetos con la siguiente estructura:
json
{
  "platform": "youtube | soundcloud | spotify",
  "url": "url original pegada por el usuario",
  "embedId": "ID extraído para YouTube y Spotify",
  "embedHtml": "iframe HTML solo para SoundCloud",
  "type": "audio | video",
  "title": "título opcional definido por el usuario"
}
Las fotos de perfil y portadas de eventos se suben a Cloudinary. En MongoDB se guarda únicamente la URL resultante. Nunca se guardan archivos binarios en la base de datos.
DISPONIBILIDAD La disponibilidad debe ser clara, visual y sencilla. Debe comunicarse con estados como:
•	Disponible
•	Contactar para coordinar
•	No disponible
No tiene que ser un sistema complejo en esta primera versión.
EVENTOS Los perfiles que ofrecen servicios podrán publicar eventos. Cada evento podrá incluir:
•	foto o portada (subida a Cloudinary, se guarda la URL)
•	título
•	fecha
•	descripción
•	ubicación
•	contenido visual adicional si corresponde
Los eventos deben poder verse con una lógica tipo red social, ya sea:
•	en una sección general dentro de la web
•	o dentro del perfil de cada DJ/proveedor
Los usuarios deben poder ver esos eventos y luego contactar al servicio relacionado.
BÚSQUEDA La búsqueda debe ser simple y clara. Debe incluir filtros manuales por:
•	ubicación
•	género musical
•	tipo de fiesta o evento
•	disponibilidad
•	rango de precio
El precio no debe mostrarse de forma exacta si no corresponde. Debe mostrarse como etiqueta "Consultar".
CONTACTO El canal principal de contacto será WhatsApp. Cada perfil podrá tener un número configurado por el usuario para contacto directo.
ADMINISTRACIÓN Debe existir un panel de administración. El admin inicial será el usuario registrado con:
•	correo: ssantii200@gmail.com
•	contraseña: la del mismo mail
Ese usuario debe tener permisos de administrador.
El panel de admin debe incluir:
•	moderación de perfiles
•	moderación de fotos
•	moderación de eventos
•	estadísticas básicas de uso
Las estadísticas deben ser útiles para el seguimiento general de la plataforma.
DISEÑO Y EXPERIENCIA El diseño debe ser:
•	oscuro
•	descontracturado
•	visual
•	elegante
•	moderno
•	con bordes redondeados
•	con una sensación cercana a iOS mezclada con Apple music e Instagram
•	con tipografías llamativas y expresivas
•	con mucho foco en imagen, video y movimiento
La experiencia debe usar animaciones suaves y elegantes, especialmente con scroll. Se pueden usar efectos de:
•	scroll trigger
•	textos que aparecen progresivamente
•	imágenes que entran con transición
•	bloques visuales con movimiento sutil
No se debe sobrecargar la web. Debe sentirse premium, pero liviana y clara. Debe ser totalmente responsive.
TECNOLOGÍAS
Frontend:
•	React con Vite
•	TypeScript
•	Tailwind CSS
•	Zustand para estado global
Animaciones:
•	GSAP
Backend:
•	Node.js con Express
Base de datos:
•	MongoDB Atlas con Mongoose
Autenticación:
•	OAuth con Google
•	JWT para manejo de sesiones
Archivos y medios:
•	Cloudinary para imágenes y portadas
Deploy:
•	Frontend en Netlify
•	Backend en Render
•	Base de datos en MongoDB Atlas
DISEÑO DE SISTEMA La aplicación debe estar pensada para escalar en el futuro y permitir agregar más funcionalidades como:
•	reseñas
•	pagos
•	eventos en vivo
•	monetización
•	rankings
•	mensajería interna
REGLAS IMPORTANTES
•	No usar emojis en el código ni en la interfaz.
•	No cambiar el MVP base salvo que yo lo autorice.
•	Mantener coherencia visual y estructural en toda la aplicación.
•	Priorizar claridad, estética y experiencia fluida.
•	Todo debe sentirse profesional, moderno y visualmente fuerte.
•	Debes dejar preparados todos los .env para que yo pueda llenar las credenciales.

