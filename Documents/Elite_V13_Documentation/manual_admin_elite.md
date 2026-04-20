# Manual de Usuario: Administrador del Sistema
**Módulo**: Configuración Maestra y Parámetros Core  
**Rol**: Super Admin / Administrador IT

Este manual está diseñado para el personal técnico o administrativo que tiene la responsabilidad de configurar las reglas de negocio sobre las cuales operan los algoritmos de TalenHuman.

---

## 1. Configuración de Reglas IA (Predictive Rules)
Como administrador, usted define la "inteligencia" del sistema.

- **Ratio de Staffing**: Aquí define cuánta carga de trabajo puede soportar un empleado. 
    - *Ejemplo*: 1 Cajero por cada $800,000 en ventas.
- **Ventana de Observación**: Defina cuántas semanas hacia atrás debe mirar la IA para proponer el horario (Por defecto: 3 semanas).
- **Carga Mínima**: Establezca el personal mínimo que siempre debe estar en la tienda, independientemente de si hay ventas o no (ej. 2 personas para apertura).

---

## 2. Gestión de Estructura Organizacional
El administrador centraliza la creación de los maestros de datos:

- **Sedes y Marcas**: Creación y edición de tiendas, incluyendo sus IDs externos para integración de ventas.
- **Catálogo de Cargos (Profiles)**: Definición de roles como Cocinero, Mesero, Hostess, etc.
- **Jornadas**: Configuración de las horas semanales legales (ej. 47h o 48h) que el sistema usará para alertar sobre horas extras.

---

## 3. Seguridad y Permisos
El sistema utiliza un modelo de **Control de Acceso Basado en Roles (RBAC)**.

- **Gestión de Usuarios**: Dar de alta a nuevos Gerentes o personal de RH.
- **Vínculo de Sedes**: Asignar qué gerentes tienen permiso para ver qué tiendas. *Recuerde que un gerente solo ve los datos de su propia sede por seguridad.*

---

## 4. Monitor de Sincronización
El administrador tiene acceso al log de carga de ventas. Si una integración falla, aquí podrá ver el error técnico y re-intentar la carga de datos para que la predicción de la semana sea precisa.

---
*Fin del Manual de Administrador*
