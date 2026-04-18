import LegalLayout from './LegalLayout';

// TODO: Заполнить перед продакшн-запуском: ИНН, ОГРН, банковские реквизиты,
// shop ID ЮKassa, актуальные цены на пакеты gems

export default function OfferPage() {
  return (
    <LegalLayout title="Публичная оферта">
      <p className="text-white/50 text-xs">
        Редакция от 01.01.2025 · Оферент: [TODO: ФИО/наименование, ИНН, ОГРН]
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        1. Предмет оферты
      </h2>
      <p>
        Настоящая публичная оферта (далее — «Оферта») является официальным предложением
        [TODO: ФИО/наименование оператора] (далее — «Оферент») заключить договор купли-продажи
        цифрового товара — пакетов кристаллов (gems) — внутри игрового сервиса Game Your Life.
        Принятием (акцептом) оферты является факт оплаты выбранного пакета.
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        2. Описание товара
      </h2>
      <p>
        Кристаллы (gems) — цифровой игровой товар внутри Сервиса Game Your Life.
        Gems не являются средством платежа, электронными деньгами или криптовалютой.
        Gems используются исключительно для приобретения внутриигровых предметов в каталоге Сервиса.
      </p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { amount: '100 кристаллов', price: '[TODO] ₽', id: 'gems_100' },
          { amount: '500 кристаллов', price: '[TODO] ₽', id: 'gems_500' },
          { amount: '1500 кристаллов', price: '[TODO] ₽', id: 'gems_1500' },
        ].map((pack) => (
          <div key={pack.id} className="border border-yellow-400/30 p-4 text-center">
            <p className="text-yellow-400 font-bold text-sm">{pack.amount}</p>
            <p className="text-white/60 text-xs mt-1">{pack.price}</p>
          </div>
        ))}
      </div>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        3. Порядок оплаты
      </h2>
      <p>
        Оплата осуществляется через платёжную систему ЮKassa (ООО «ЮMoney», ИНН 7750005725).
        После успешного платежа gems автоматически зачисляются на аккаунт пользователя.
        Доступные способы оплаты: банковская карта Visa/Mastercard/МИР, ЮMoney, СБП.
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        4. Политика возврата
      </h2>
      <p>
        Кристаллы (gems) являются цифровым товаром. В соответствии с п. 4 ст. 26.1
        Закона РФ «О защите прав потребителей» и ст. 25 того же закона, надлежащего
        качества цифровые товары возврату и обмену не подлежат после их предоставления.
        Возврат средств возможен только в случае технической ошибки при зачислении —
        обратитесь на support@gameyourlife.ru в течение 14 дней.
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        5. Срок действия
      </h2>
      <p>
        Gems не имеют срока действия и сохраняются на аккаунте бессрочно при соблюдении
        пользователем настоящего Соглашения. В случае удаления аккаунта пользователем
        неиспользованные gems аннулируются без компенсации.
      </p>

      <h2 className="text-yellow-400 mt-8 mb-3" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
        6. Контакты оферента
      </h2>
      <p>Email: support@gameyourlife.ru · [TODO: юридический адрес]</p>
    </LegalLayout>
  );
}
