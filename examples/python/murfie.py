# a command-line player for Murfie

import httplib, urllib, json, pyglet, getpass
from subprocess import call

authtoken = ''

# API http bits
conn = httplib.HTTPSConnection('www.murfie.com')

def authenticate():
	# gather the authentication credentials
	email = raw_input('Email:')
	password = getpass.getpass()

	# get the token
	params = urllib.urlencode({'email':email, 'password':password})
	headers = {'Content-type':'application/x-www-form-urlencoded','Accept':'text/plain'}
	conn.request('POST', '/api/tokens', params, headers)
	response = conn.getresponse()

	apiResult = json.loads(response.read())
	conn.close()

	return apiResult['user']['token']

def pickDisc():
	# get the album list
	conn.request('GET', '/api/discs.json?auth_token=' + authtoken)
	response = conn.getresponse()
	apijson = json.loads(response.read())
	discindex = 0
	for disc in apijson:
		print discindex, disc['disc']['album']['title']
		discindex += 1

	selecteddisc = int(raw_input('\nDisc to play: '))
	selecteddiscid = apijson[selecteddisc]['disc']['id']
	print("\n%s by %s selected" % (apijson[selecteddisc]['disc']['album']['title'],apijson[selecteddisc]['disc']['album']['main_artist']))

	# get tracks for selected disc
	conn.request('GET', '/api/discs/%d.json' % apijson[selecteddisc]['disc']['id'])
	response = conn.getresponse()
	apiResult = json.loads(response.read())
	disc = apiResult['disc']

	return disc

def playDisc(disc):
	# display controls
	print('space to pause, f to skip')

	# play each track in the disc
	for track in disc['tracks']:

		print('\nNow Playing %s by %s' % (track['title'], disc['album']['main_artist']))

		# get the media Uri
		#mediaUri = 'http://pocky.herokuapp.com/?discId%dtrackId%dtoken%s' % (disc['id'],track['id'],authtoken)
		conn.request('GET', '/api/discs/%s/tracks/%s.json?auth_token=%s' % (disc['id'],track['id'],authtoken))
		response = conn.getresponse()
		apiResult = json.loads(response.read())
		mediaUri = '\"%s\"' % apiResult['track']['url']

		#mediaUri = mediaUri.replace('&', '&amp;')

		playerProgram = 'mpg123'
		playerArguments = ['-q', mediaUri]
		command = [playerProgram]
		command.extend(playerArguments)
		call(command)

	# when the disc is over, select another
	playDisc(pickDisc())

# start by authenticating
authtoken = authenticate()
playDisc(pickDisc())