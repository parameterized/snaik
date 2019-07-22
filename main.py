
from aiohttp import web
import socketio

import numpy as np
import random
from keras.models import Sequential
from keras.layers import Dense
from keras.optimizers import Adam
import keras.backend as K

model = Sequential()
#model.add(Dense(8, input_shape=(8,), activation='tanh'))
#model.add(Dense(4))
model.add(Dense(4, input_shape=(8,)))
model.compile(optimizer=Adam(0.001), loss='mse')
model.predict_on_batch(np.zeros((1, 8)))
games = {}
exploration_rate = 1

# weight init that outputs max action for min distance input
if False:
    w = np.zeros((8, 4))
    b = np.zeros((4,))
    w[4:, 0] = [-1, 1/3, 1/3, 1/3]
    w[4:, 1] = [1/3, -1, 1/3, 1/3]
    w[4:, 2] = [1/3, 1/3, -1, 1/3]
    w[4:, 3] = [1/3, 1/3, 1/3, -1]
    model.set_weights([w, b])
    exploration_rate = 0.5

sio = socketio.AsyncServer()
app = web.Application()
sio.attach(app)

async def index(request):
    with open('index.html') as f:
        return web.Response(text=f.read(), content_type='text/html')

@sio.event
def connect(sid, environ):
    print('connect ', sid)

@sio.event
def disconnect(sid):
    print('disconnect ', sid)

@sio.event
async def predict(sid, data):
    global exploration_rate
    res = {'id': data.get('id')}
    actions = ['right', 'left', 'up', 'down']
    y = model.predict_on_batch(np.array([data.get('simpleInput')]))[0]
    res['preds'] = {v: float(y[i]) for i, v in enumerate(actions)}
    if random.random() < exploration_rate:
        if len(data.get('actions')) == 0:
            action = random.choice(actions)
        else:
            action = random.choice(data.get('actions'))
    else:
        action_preds = {}
        for i, v in enumerate(actions):
            if v in data.get('actions'):
                action_preds[i] = y[i]
        if len(action_preds) == 0:
            action = random.choice(actions)
        else:
            action = actions[max(action_preds, key=action_preds.get)]
    res['dir'] = action
    await sio.emit('action', res, room=sid)

    if data.get('id') not in games:
        games[data.get('id')] = []
    game = games[data.get('id')]
    data['action'] = {v: i for i, v in enumerate(actions)}[action]
    game.append(data)
    if len(game) > 1 and game[-1].get('stepNum') - game[-2].get('stepNum') == 1:
        old_q = model.predict_on_batch(np.array([game[-2].get('simpleInput')]))
        new_q = model.predict_on_batch(np.array([game[-1].get('simpleInput')]))
        reward = game[-1].get('score') - game[-2].get('score')
        reward *= 100
        old_q[0, game[-2].get('action')] = reward + 0.95*np.amax(new_q[0])
        model.train_on_batch(np.array([game[-2].get('simpleInput')]), old_q)
    exploration_rate -= 1/(240*60*5)


@sio.on('gameOver')
def game_over(sid, data):
    print(data.get('id'), 'Game Over')
    print('Exploration Rate: {}'.format(exploration_rate))
    """ reset weights
    session = K.get_session()
    for layer in model.layers:
        if hasattr(layer, 'kernel_initializer'):
            layer.kernel.initializer.run(session=session)
    print(model.get_weights())
    """
    if not data.get('timeout'):
        game = games.get(data.get('id'))
        if game and len(game) > 0:
            q = model.predict_on_batch(np.array([game[-1].get('simpleInput')]))
            q[0, game[-1].get('action')] = -10
            model.train_on_batch(np.array([game[-1].get('simpleInput')]), q)
    games.pop(data.get('id'), None)

app.router.add_static('/static', 'static')
app.router.add_get('/', index)

if __name__ == '__main__':
    web.run_app(app)