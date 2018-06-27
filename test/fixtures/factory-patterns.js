module.exports = (Factory) => {
  const {Note} = Factory.models

  Factory.define('note', Note, {
    title: 'Hello',
    content: 'Hello there',
  })

  Factory.define('story', 'note', {
    title: "Foobar's grand adventure.",
    content: 'Foobar travels through the forest of magical enchantments accompanied by his special white pony, Beefcake.  Meanwhile, the demon-god Moloch searches relentlessly for his prize.',
  })
}
