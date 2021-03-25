import React, { useState } from 'react'
import {observer} from 'mobx-react'
import { useBreakoutRoomStore, useBoardStore, useRoomStore } from '@/hooks'
import { EduMediaStream } from '@/stores/app/room'
import { t } from '@/i18n'
import { ChatPanel } from '@/components/chat/panel'
import { StudentList } from '@/components/student-list'
import { EmojiObject } from 'react-twemoji-picker';

export const AssistantChatBoard = observer(() => {
  const breakoutRoomStore = useBreakoutRoomStore()

  const [value, setValue] = useState<string>('')

  const sendMessage = async (message: any) => {
    await breakoutRoomStore.sendMessageToCurrentRoom(message)
    setValue('')
  }

  const handleChange = (evt: any) => {
    setValue(evt.target.value)
  }

  const handleSelectEmoji = (emoji: EmojiObject, evt: KeyboardEvent) => {
    evt.preventDefault();
    const emPic = String.fromCodePoint(parseInt(emoji.unicode, 16))
    const chatWithEmoji = value + emPic;
    console.log('chat with emoji ', chatWithEmoji);
    setValue(chatWithEmoji);
  }


  const {
    mutedChat,
    studentStreams
  } = breakoutRoomStore

  const handleMute = async () => {
    if (mutedChat) {
      await breakoutRoomStore.unmuteChat()
    } else {
      await breakoutRoomStore.muteChat()
    }
  }

  const roomStore = useRoomStore();
  
  const [gif, setGif] = useState(null);

  const sendGifMessage = async () => {
    await roomStore.sendGifMessage(gif)
  }

  const handleSendGifMessage = async (gif: any, evt: any) => {
    await sendGifMessage()
    setGif(null);
  }

  const userRole = breakoutRoomStore.roomInfo.userRole

  const boardStore = useBoardStore()
  const { grantUsers } = boardStore

  const handleClick = async (evt: any, id: string, type: string) => {
    const isLocal = (userUuid: string) => breakoutRoomStore.roomInfo.userUuid === userUuid
    if (breakoutRoomStore.roomInfo.userRole === 'assistant' || isLocal(id)) {
      const target = studentStreams.find((it: EduMediaStream) => it.userUuid === id)
      switch (type) {
        case 'grantBoard': {
          if (boardStore.checkUserPermission(id)) {
            boardStore.revokeBoardPermission(id)
          } else {
            boardStore.grantBoardPermission(id)
          }
          break
        }
        case 'audio': {
          if (target) {
            if (target.audio) {
              await breakoutRoomStore.muteStudentAudio(id, false)
            } else {
              await breakoutRoomStore.unmuteStudentAudio(id, false)
            }
          }
          break
        }
        case 'video': {
          if (target) {
            if (target.video) {
              await breakoutRoomStore.muteStudentVideo(id, false)
            } else {
              await breakoutRoomStore.unmuteStudentVideo(id, false)
            }
          }
          break
        }
      }
    }
  }

  return (
    <>
      <div className="menu">
        <div
          className={`item ${breakoutRoomStore.activeTab === 'first' ? 'active' : ''}`}
          onClick={() => {
            breakoutRoomStore.switchTab('first')
          }}>
          {t('room.chat_room')}
          {breakoutRoomStore.activeTab !== 'first' && breakoutRoomStore.unreadMessageCount > 0 ? <span className={`message-count`}>{breakoutRoomStore.unreadMessageCount}</span> : null}
        </div>
        <div
          className={`item ${breakoutRoomStore.activeTab === 'second' ? 'active' : ''}`}
          onClick={() => {
            breakoutRoomStore.switchTab('second')
          }}
        >
          {t('room.student_list')}
        </div>
      </div>
      <div className={`chat-container ${breakoutRoomStore.activeTab === 'first' ? '' : 'hide'}`}>
        <ChatPanel
          canChat={breakoutRoomStore.roomInfo.userRole === 'assistant'}
          muteControl={breakoutRoomStore.muteControl}
          muteChat={breakoutRoomStore.mutedChat}
          handleMute={handleMute}
          messages={breakoutRoomStore.roomChatMessages}
          value={value}
          sendMessage={sendMessage}
          handleSendGifMessage={handleSendGifMessage}
          handleSelectEmoji={handleSelectEmoji}
          handleChange={handleChange} />
      </div>
      <div className={`student-container ${breakoutRoomStore.activeTab !== 'first' ? '' : 'hide'}`}>
        <StudentList
          userRole={userRole}
          studentStreams={studentStreams}
          grantUsers={grantUsers}
          handleClick={handleClick}
        />
      </div>
    </>
  )
})