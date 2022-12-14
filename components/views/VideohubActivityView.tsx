import { ActivityItem, Icon, Link, mergeStyleSets, Stack, Text } from '@fluentui/react';
import Router from 'next/router';
import * as React from 'react';
import { VideohubActivity } from '../interfaces/Videohub';

const classNames = mergeStyleSets({
  exampleRoot: {
    marginTop: '20px',
  },
  nameText: {
    fontWeight: '500',
  },
});

export const VideohubActivityView = (p: { activityItems: VideohubActivity[] }) => {

  return (
    <Stack>
      <Stack.Item>
        <h1>Recent Activity of Videohubs</h1>
      </Stack.Item>
      <Stack.Item>
        {p.activityItems.length == 0 ?
          <p>No activities yet.</p> :
          p.activityItems.map((item, _key) => (
            <ActivityItem activityIcon={<Icon iconName={item.icon} />} timeStamp={item.time.toLocaleDateString() + " " + item.time.toLocaleTimeString()}
              comments={[
                <Link
                  key={item.id + "_videohub"}
                  onClick={(_event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>) => {
                    Router.push({
                      pathname: '../videohub',
                      query: { videohub: item.videohub_id },
                    });
                  }}
                >{item.title}</Link>,
              ]} activityDescription={[<Text key={item.id + "_text"} className={classNames.nameText}>{item.description}</Text>]} key={item.id} className={classNames.exampleRoot} />
          ))}
      </Stack.Item>
    </Stack>
  );
};
