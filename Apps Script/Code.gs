/**
 * Code.gs - Enrutador Principal de la API REST
 * ============================================
 */

var CONFIG = {
  VERSION: '1.0.0',
  USERS_SHEET: '_APP_USUARIOS',
  CLIENTS_SHEET: '_APP_CLIENTES',
  SERVICES_SHEET: '_APP_SERVICIOS',
  ACCOUNTS_SHEET: '_APP_CUENTAS',
  PAYMENTS_CLIENTS_SHEET: '_APP_PAGOS_CLIENTES',
  PAYMENTS_PLATFORMS_SHEET: '_APP_PAGOS_PLATAFORMAS',
  HISTORY_SHEET: '_APP_HISTORIAL',
  CONFIG_SHEET: '_APP_CONFIG',
  
  CYCLE_DAYS: 30,
  REMINDER_HOURS: 24,
  CANCEL_HOURS: 36,
  CANCEL_ALERT_HOURS: 36,
  
  STATUS: {
    ACTIVO: 'ACTIVO',
    POR_VENCER: 'POR_VENCER',
    VENCIDO: 'VENCIDO',
    RENOVACION_PENDIENTE: 'RENOVACION_PENDIENTE',
    PAGO_PENDIENTE: 'PAGO_PENDIENTE',
    RECORDATORIO_ENVIADO: 'RECORDATORIO_ENVIADO',
    CANCELACION_PENDIENTE: 'CANCELACION_PENDIENTE',
    CANCELADO: 'CANCELADO'
  }
};

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  var output = {
    success: false,
    timestamp: new Date().toISOString(),
    data: null,
    error: null
  };
  
  try {
    var action = '';
    var payload = {};
    
    if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action;
    }
    
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
        if (!action && payload.action) {
          action = payload.action;
        }
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var publicActions = ['ping', 'login'];
    var session = null;
    if (publicActions.indexOf(action) === -1) {
      session = requireSession(payload.token);
    }

    switch (action) {
      case 'ping':
        output.success = true;
        output.data = { message: 'API Cobros Activa', version: CONFIG.VERSION };
        break;

      case 'setup_database':
        requireAdmin(session);
        output.data = setupDatabase();
        output.success = true;
        break;

      case 'migrate_initial_data':
        requireAdmin(session);
        output.data = migrateExistingData();
        output.success = true;
        break;

      case 'login':
        output.data = loginUser(payload.email, payload.password);
        output.success = true;
        break;

      case 'get_app_data':
        output.data = getAppData();
        output.success = true;
        break;

      case 'get_dashboard':
        output.data = getDashboardData();
        output.success = true;
        break;

      case 'get_clients':
        output.data = getClientsList();
        output.success = true;
        break;

      case 'save_client':
        output.data = saveClient(payload.client, session);
        output.success = true;
        break;

      case 'batch_update_phones':
        output.data = batchUpdateClientPhones(payload.phones, session);
        output.success = true;
        break;

      case 'get_services':
        output.data = getServicesList();
        output.success = true;
        break;

      case 'save_service':
        output.data = saveService(payload.service, session);
        output.success = true;
        break;

      case 'delete_service':
        output.data = deleteService(payload.serviceId, session);
        output.success = true;
        break;

      case 'change_service_status':
        output.data = changeServiceStatus(payload.serviceId, payload.newStatus, payload.notes, session);
        output.success = true;
        break;

      case 'register_payment':
        output.data = registerClientPayment(payload.payment, session);
        output.success = true;
        break;

      case 'get_accounts':
        output.data = getAccountsList();
        output.success = true;
        break;

      case 'save_account':
        output.data = saveAccount(payload.account, session);
        output.success = true;
        break;

      case 'cancel_account':
        output.data = cancelAccount(payload.accountId, session);
        output.success = true;
        break;

      case 'get_platform_payments':
        output.data = getPlatformPayments();
        output.success = true;
        break;

      case 'save_platform_payment':
        output.data = savePlatformPayment(payload.payment, session);
        output.success = true;
        break;

      case 'mark_platform_payment_paid':
        output.data = markPlatformPaymentPaid(payload.paymentId, session);
        output.success = true;
        break;

      case 'delete_platform_payment':
        output.data = deletePlatformPayment(payload.paymentId, session);
        output.success = true;
        break;

      case 'get_history':
        output.data = getHistoryLog(payload.limit || 100);
        output.success = true;
        break;

      case 'run_hourly_scheduler':
        requireAdmin(session);
        output.data = runHourlyScheduler();
        output.success = true;
        break;

      default:
        throw new Error('Acción desconocida o no especificada: ' + action);
    }
  } catch (error) {
    output.success = false;
    output.error = error.message || error.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}