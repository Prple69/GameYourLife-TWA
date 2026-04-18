import LegalLayout from './LegalLayout';

// TODO: Заполнить реквизиты оператора перед продакшн-запуском:
// - ИНН, ОГРН, юридический адрес, ФИО оператора ПД

export default function PrivacyPage() {
  return (
    <LegalLayout title="Политика конфиденциальности">
      <p className="text-white/50 text-xs">Редакция от 01.01.2025 · Оператор ПД: [TODO: ФИО / ИП, ИНН]</p>

      <h2 className="text-yellow-400 text-base mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        1. Общие положения
      </h2>
      <p>
        Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки
        персональных данных пользователей сервиса Game Your Life (далее — «Сервис»), доступного
        по адресу gameyourlife.ru. Политика разработана в соответствии с Федеральным законом
        №152-ФЗ «О персональных данных».
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        2. Оператор персональных данных
      </h2>
      <p>
        Оператор: [TODO: ФИО или наименование ИП/ООО], ИНН: [TODO], ОГРН: [TODO],
        юридический адрес: [TODO]. Контактный email: support@gameyourlife.ru.
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        3. Какие данные мы собираем
      </h2>
      <ul className="list-disc list-inside space-y-2 ml-2">
        <li>Адрес электронной почты (при регистрации)</li>
        <li>Отображаемое имя (display_name), выбираемое пользователем</li>
        <li>Идентификатор Telegram (telegram_id) при входе через Telegram Login</li>
        <li>IP-адрес и данные браузера (User-Agent) — технически необходимые данные</li>
        <li>Игровые данные: прогресс персонажа, квесты, транзакции виртуальной валюты</li>
      </ul>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        4. Цели обработки
      </h2>
      <ul className="list-disc list-inside space-y-2 ml-2">
        <li>Идентификация пользователя и предоставление доступа к Сервису</li>
        <li>Обеспечение работы игровых функций и персонализации</li>
        <li>Отправка технических уведомлений (подтверждение email, сброс пароля)</li>
        <li>Обеспечение безопасности аккаунта</li>
        <li>Улучшение качества Сервиса</li>
      </ul>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        5. Правовые основания обработки
      </h2>
      <p>
        Обработка персональных данных осуществляется на основании согласия пользователя
        (ст. 6 ч. 1 п. 1 152-ФЗ), а также в целях исполнения договора (оферты),
        стороной которого является пользователь (ст. 6 ч. 1 п. 5 152-ФЗ).
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        6. Сроки хранения данных
      </h2>
      <p>
        Данные хранятся в течение срока действия аккаунта плюс 3 года после его удаления,
        если иное не установлено законодательством РФ. Технические логи хранятся не более 90 дней.
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        7. Передача данных третьим лицам
      </h2>
      <p>
        Данные не передаются третьим лицам в коммерческих целях. Данные могут передаваться
        техническим подрядчикам (хостинг-провайдер, платёжная система ЮKassa) в объёме,
        необходимом для оказания услуг. Передача осуществляется только на серверы, расположенные
        на территории РФ, в соответствии со ст. 18 152-ФЗ.
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        8. Права субъекта персональных данных
      </h2>
      <p>Вы вправе:</p>
      <ul className="list-disc list-inside space-y-2 ml-2">
        <li>Получить сведения об обработке ваших данных</li>
        <li>Потребовать исправления неточных данных</li>
        <li>Отозвать согласие и потребовать удаления данных</li>
        <li>Обратиться с жалобой в Роскомнадзор</li>
      </ul>
      <p className="mt-3">Для реализации прав обратитесь на: support@gameyourlife.ru</p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        9. Файлы cookie
      </h2>
      <p>
        Сервис использует технически необходимые cookie (аутентификация) и аналитические cookie
        (при вашем согласии). Управление cookie осуществляется через баннер при первом посещении
        сайта. Отказ от аналитических cookie не влияет на работу основных функций Сервиса.
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        10. Изменения политики
      </h2>
      <p>
        Оператор вправе вносить изменения в Политику. При существенных изменениях пользователи
        будут уведомлены по email. Актуальная версия всегда доступна по адресу gameyourlife.ru/privacy.
      </p>
    </LegalLayout>
  );
}
